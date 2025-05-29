class ComponentLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.loadCache = new Map();
    this.loadedClasses = new Map();
    this.baseURL = (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) ? chrome.runtime.getURL('') : '';
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async loadComponent(componentId, componentPath) {
    // Return cached component if already loaded
    if (this.loadedClasses.has(componentId)) {
      return this.loadedClasses.get(componentId);
    }

    // Return existing loading promise if component is currently being loaded
    if (this.loadingPromises.has(componentId)) {
      return this.loadingPromises.get(componentId);
    }

    // Start loading the component
    const loadingPromise = this._loadComponentWithRetry(componentId, componentPath);
    this.loadingPromises.set(componentId, loadingPromise);

    try {
      const ComponentClass = await loadingPromise;
      this.loadedClasses.set(componentId, ComponentClass);
      return ComponentClass;
    } finally {
      this.loadingPromises.delete(componentId);
    }
  }

  async _loadComponentWithRetry(componentId, componentPath, attempt = 1) {
    try {
      return await this._loadComponentDirect(componentId, componentPath);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(`Failed to load component ${componentId}, attempt ${attempt}/${this.retryAttempts}:`, error);
        await this._delay(this.retryDelay * attempt);
        return this._loadComponentWithRetry(componentId, componentPath, attempt + 1);
      } else {
        console.error(`Failed to load component ${componentId} after ${this.retryAttempts} attempts:`, error);
        throw new ComponentLoadError(`Failed to load component ${componentId}`, error);
      }
    }
  }

  async _loadComponentDirect(componentId, componentPath) {
    const fullPath = this._resolveComponentPath(componentPath);
    
    try {
      // First, try to load as ES module
      const module = await this._loadAsModule(fullPath);
      return this._extractComponentClass(module, componentId);
    } catch (moduleError) {
      console.warn(`Failed to load ${componentId} as module:`, moduleError);
      
      try {
        // Fallback to script injection
        return await this._loadAsScript(fullPath, componentId);
      } catch (scriptError) {
        console.error(`Failed to load ${componentId} as script:`, scriptError);
        throw new ComponentLoadError(`All loading methods failed for ${componentId}`, {
          moduleError,
          scriptError
        });
      }
    }
  }

  _resolveComponentPath(componentPath) {
    if (componentPath.startsWith('http://') || componentPath.startsWith('https://')) {
      return componentPath;
    }
    
    if (componentPath.startsWith('/')) {
      return this.baseURL + componentPath.slice(1);
    }
    
    return this.baseURL + componentPath;
  }

  async _loadAsModule(fullPath) {
    // Use dynamic import for ES modules
    const module = await import(fullPath);
    this.loadedModules.set(fullPath, module);
    return module;
  }

  async _loadAsScript(fullPath, componentId) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[data-component-id="${componentId}"]`);
      if (existingScript) {
        // Wait a bit for the script to execute
        setTimeout(() => {
          const ComponentClass = this._findComponentClass(componentId);
          if (ComponentClass) {
            resolve(ComponentClass);
          } else {
            reject(new Error(`Component class not found after script load: ${componentId}`));
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = fullPath;
      script.type = 'text/javascript';
      script.dataset.componentId = componentId;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        // Give the script time to execute and register the component
        setTimeout(() => {
          const ComponentClass = this._findComponentClass(componentId);
          if (ComponentClass) {
            resolve(ComponentClass);
          } else {
            reject(new Error(`Component class not found after script load: ${componentId}`));
          }
        }, 100);
      };

      script.onerror = () => {
        document.head.removeChild(script);
        reject(new Error(`Failed to load script: ${fullPath}`));
      };

      document.head.appendChild(script);
    });
  }

  _extractComponentClass(module, componentId) {
    // Try to find the component class in the module
    
    // 1. Check for default export
    if (module.default && typeof module.default === 'function') {
      return module.default;
    }

    // 2. Check for named export matching the component ID
    const className = this._componentIdToClassName(componentId);
    if (module[className] && typeof module[className] === 'function') {
      return module[className];
    }

    // 3. Check for any export that extends HTMLElement
    for (const [name, exportedItem] of Object.entries(module)) {
      if (typeof exportedItem === 'function' && this._extendsHTMLElement(exportedItem)) {
        return exportedItem;
      }
    }

    throw new Error(`No valid component class found in module for ${componentId}`);
  }

  _findComponentClass(componentId) {
    // Try to find the component class in global scope
    const className = this._componentIdToClassName(componentId);

    // Check window object
    if (window[className] && typeof window[className] === 'function') {
      return window[className];
    }

    // Check if it's already registered as a custom element
    const tagName = this._componentIdToTagName(componentId);
    if (customElements.get(tagName)) {
      return customElements.get(tagName);
    }

    return null;
  }

  _componentIdToClassName(componentId) {
    // Convert kebab-case to PascalCase
    return componentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  _componentIdToTagName(componentId) {
    // Ensure kebab-case
    return componentId.toLowerCase().replace(/_/g, '-');
  }

  _extendsHTMLElement(cls) {
    try {
      return cls.prototype instanceof HTMLElement || cls === HTMLElement;
    } catch (error) {
      return false;
    }
  }

  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async preloadComponents(componentIds, componentMap) {
    const preloadPromises = componentIds.map(async (componentId) => {
      try {
        const componentInfo = componentMap.get(componentId);
        if (!componentInfo) {
          console.warn(`Component info not found for preload: ${componentId}`);
          return null;
        }

        const ComponentClass = await this.loadComponent(componentId, componentInfo.path);
        return { componentId, ComponentClass, success: true };
      } catch (error) {
        console.warn(`Failed to preload component ${componentId}:`, error);
        return { componentId, error, success: false };
      }
    });

    const results = await Promise.allSettled(preloadPromises);
    
    const successful = results
      .filter(result => result.status === 'fulfilled' && result.value?.success)
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected' || !result.value?.success)
      .map(result => result.value || { error: result.reason });

    return { successful, failed };
  }

  validateComponent(ComponentClass, expectedId) {
    const validationResults = {
      valid: true,
      warnings: [],
      errors: []
    };

    try {
      // Check if it's a function/class
      if (typeof ComponentClass !== 'function') {
        validationResults.errors.push('Component is not a function or class');
        validationResults.valid = false;
        return validationResults;
      }

      // Check if it extends HTMLElement
      if (!this._extendsHTMLElement(ComponentClass)) {
        validationResults.errors.push('Component does not extend HTMLElement');
        validationResults.valid = false;
      }

      // Check for required methods
      const requiredMethods = ['connectedCallback'];
      const prototype = ComponentClass.prototype;

      requiredMethods.forEach(method => {
        if (typeof prototype[method] !== 'function') {
          validationResults.warnings.push(`Missing recommended method: ${method}`);
        }
      });

      // Try to create an instance (basic instantiation test)
      try {
        const instance = new ComponentClass();
        
        // Check for shadow root
        if (!instance.shadowRoot) {
          validationResults.warnings.push('Component does not create shadow DOM');
        }

        // Check for basic properties
        if (!instance.tagName) {
          validationResults.warnings.push('Component does not have a tag name');
        }

      } catch (instantiationError) {
        validationResults.errors.push(`Component cannot be instantiated: ${instantiationError.message}`);
        validationResults.valid = false;
      }

    } catch (error) {
      validationResults.errors.push(`Validation error: ${error.message}`);
      validationResults.valid = false;
    }

    return validationResults;
  }

  getLoadedComponents() {
    return Array.from(this.loadedClasses.entries()).map(([id, ComponentClass]) => ({
      id,
      className: ComponentClass.name,
      loadedAt: this.loadCache.get(id)?.loadedAt || Date.now(),
      isRegistered: !!customElements.get(this._componentIdToTagName(id))
    }));
  }

  getLoadingStatus() {
    return {
      loaded: this.loadedClasses.size,
      loading: this.loadingPromises.size,
      cached: this.loadCache.size,
      loadedIds: Array.from(this.loadedClasses.keys())
    };
  }

  unloadComponent(componentId) {
    this.loadedClasses.delete(componentId);
    this.loadCache.delete(componentId);
    
    // Find and remove any associated scripts
    const script = document.querySelector(`script[data-component-id="${componentId}"]`);
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    
    // Note: We cannot unregister custom elements once registered
    // This is a limitation of the Custom Elements API
  }

  clearCache() {
    this.loadedClasses.clear();
    this.loadCache.clear();
    this.loadedModules.clear();
    
    // Remove all component scripts
    const componentScripts = document.querySelectorAll('script[data-component-id]');
    componentScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
  }

  enableDebugMode() {
    this.debugMode = true;
    
    // Add global debug helper
    window.componentLoaderDebug = {
      getLoadedComponents: () => this.getLoadedComponents(),
      getLoadingStatus: () => this.getLoadingStatus(),
      validateComponent: (id) => {
        const ComponentClass = this.loadedClasses.get(id);
        return ComponentClass ? this.validateComponent(ComponentClass, id) : null;
      },
      reloadComponent: async (id, path) => {
        this.unloadComponent(id);
        return await this.loadComponent(id, path);
      }
    };
  }

  async loadComponentFromURL(url, componentId) {
    try {
      const ComponentClass = await this._loadComponentDirect(componentId, url);
      this.loadedClasses.set(componentId, ComponentClass);
      return ComponentClass;
    } catch (error) {
      throw new ComponentLoadError(`Failed to load component from URL: ${url}`, error);
    }
  }

  createComponentInstance(componentId, config = {}) {
    const ComponentClass = this.loadedClasses.get(componentId);
    if (!ComponentClass) {
      throw new Error(`Component not loaded: ${componentId}`);
    }

    try {
      const instance = new ComponentClass();
      
      // Apply configuration
      if (config.id) {
        instance.id = config.id;
      }
      
      if (config.data) {
        instance.setData(config.data);
      }
      
      if (config.attributes) {
        Object.entries(config.attributes).forEach(([name, value]) => {
          instance.setAttribute(name, value);
        });
      }

      return instance;
    } catch (error) {
      throw new ComponentLoadError(`Failed to create instance of ${componentId}`, error);
    }
  }

  getComponentDependencies(componentId) {
    // This would analyze the component code to find dependencies
    // For now, return empty array as dependency analysis is complex
    return [];
  }

  async warmCache(componentIds, componentMap) {
    console.log(`Warming cache for ${componentIds.length} components...`);
    
    const startTime = Date.now();
    const results = await this.preloadComponents(componentIds, componentMap);
    const endTime = Date.now();
    
    console.log(`Cache warming completed in ${endTime - startTime}ms`);
    console.log(`Successful: ${results.successful.length}, Failed: ${results.failed.length}`);
    
    return results;
  }
}

class ComponentLoadError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ComponentLoadError';
    this.cause = cause;
  }
}

if (typeof window !== 'undefined') {
  window.ComponentLoader = ComponentLoader;
  window.ComponentLoadError = ComponentLoadError;
}

export { ComponentLoader, ComponentLoadError };