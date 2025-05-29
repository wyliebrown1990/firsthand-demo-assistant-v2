class ComponentManager {
  constructor() {
    this.loadedComponents = new Map();
    this.componentCache = new Map();
    this.libraryIndex = null;
    this.baseURL = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.getURL('') : '';
    this.loadLibraryIndex();
  }

  async loadLibraryIndex() {
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        throw new Error('Chrome runtime not available');
      }
      const response = await fetch(chrome.runtime.getURL('library/library-index.json'));
      this.libraryIndex = await response.json();
      console.log('Component library index loaded:', this.libraryIndex);
    } catch (error) {
      console.error('Failed to load library index:', error);
      this.libraryIndex = { components: [] };
    }
  }

  async loadComponent(componentId) {
    if (this.componentCache.has(componentId)) {
      return this.componentCache.get(componentId);
    }

    const componentInfo = this.findComponent(componentId);
    if (!componentInfo) {
      throw new Error(`Component not found: ${componentId}`);
    }

    try {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        throw new Error('Chrome runtime not available');
      }
      const componentURL = chrome.runtime.getURL(componentInfo.path);
      
      const module = await import(componentURL);
      const ComponentClass = module.default || module[componentInfo.className];
      
      if (!ComponentClass) {
        throw new Error(`Component class not exported: ${componentInfo.className}`);
      }

      this.validateComponent(ComponentClass, componentInfo);
      
      this.componentCache.set(componentId, ComponentClass);
      this.loadedComponents.set(componentId, {
        class: ComponentClass,
        metadata: componentInfo,
        loadedAt: Date.now()
      });

      return ComponentClass;
    } catch (error) {
      console.error(`Failed to load component ${componentId}:`, error);
      throw error;
    }
  }

  findComponent(componentId) {
    if (!this.libraryIndex || !this.libraryIndex.components) {
      return null;
    }

    return this.libraryIndex.components.find(comp => comp.id === componentId);
  }

  validateComponent(ComponentClass, metadata) {
    if (typeof ComponentClass !== 'function') {
      throw new Error('Component must be a constructor function or class');
    }

    if (!ComponentClass.prototype || !ComponentClass.prototype.connectedCallback) {
      throw new Error('Component must extend HTMLElement and implement connectedCallback');
    }

    // Skip instance validation for HTMLElement-based components
    // The actual validation will happen when the component is injected
    console.log(`Component ${metadata.id} validation passed`);
  }

  async preloadComponents(componentIds) {
    const loadPromises = componentIds.map(id => this.loadComponent(id).catch(error => {
      console.warn(`Failed to preload component ${id}:`, error);
      return null;
    }));

    const results = await Promise.all(loadPromises);
    return results.filter(result => result !== null);
  }

  getLoadedComponents() {
    return Array.from(this.loadedComponents.entries()).map(([id, info]) => ({
      id,
      className: info.class.name,
      metadata: info.metadata,
      loadedAt: info.loadedAt
    }));
  }

  unloadComponent(componentId) {
    this.componentCache.delete(componentId);
    this.loadedComponents.delete(componentId);
  }

  clearCache() {
    this.componentCache.clear();
    this.loadedComponents.clear();
  }

  async reloadLibraryIndex() {
    this.libraryIndex = null;
    await this.loadLibraryIndex();
  }

  searchComponents(query, filters = {}) {
    if (!this.libraryIndex || !this.libraryIndex.components) {
      return [];
    }

    let results = this.libraryIndex.components;

    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      results = results.filter(component => 
        component.name.toLowerCase().includes(searchTerm) ||
        component.description.toLowerCase().includes(searchTerm) ||
        (component.taxonomy && (
          component.taxonomy.advertiser?.toLowerCase().includes(searchTerm) ||
          component.taxonomy.advertiserVertical?.toLowerCase().includes(searchTerm) ||
          component.taxonomy.publisher?.toLowerCase().includes(searchTerm) ||
          component.taxonomy.adUnitType?.toLowerCase().includes(searchTerm)
        )) ||
        (component.demoContext && (
          component.demoContext.keyFeatures?.some(feature => 
            feature.toLowerCase().includes(searchTerm)
          ) ||
          component.demoContext.talkingPoints?.some(point => 
            point.toLowerCase().includes(searchTerm)
          )
        ))
      );
    }

    if (filters.advertiserVertical) {
      results = results.filter(component => 
        component.taxonomy?.advertiserVertical === filters.advertiserVertical
      );
    }

    if (filters.adUnitType) {
      results = results.filter(component => 
        component.taxonomy?.adUnitType === filters.adUnitType
      );
    }

    if (filters.dimensions) {
      results = results.filter(component => 
        component.taxonomy?.dimensions === filters.dimensions
      );
    }

    if (filters.interactionLevel) {
      results = results.filter(component => 
        component.taxonomy?.interactionLevel === filters.interactionLevel
      );
    }

    if (filters.publisher) {
      results = results.filter(component => 
        component.taxonomy?.publisher?.toLowerCase().includes(filters.publisher.toLowerCase()) ||
        component.taxonomy?.domain?.toLowerCase().includes(filters.publisher.toLowerCase())
      );
    }

    return results.sort((a, b) => {
      if (query) {
        const aRelevance = this.calculateRelevance(a, query);
        const bRelevance = this.calculateRelevance(b, query);
        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }
      }
      
      return a.name.localeCompare(b.name);
    });
  }

  calculateRelevance(component, query) {
    const searchTerm = query.toLowerCase();
    let relevance = 0;

    if (component.name.toLowerCase().includes(searchTerm)) relevance += 10;
    if (component.taxonomy?.advertiser?.toLowerCase().includes(searchTerm)) relevance += 8;
    if (component.taxonomy?.adUnitType?.toLowerCase().includes(searchTerm)) relevance += 6;
    if (component.description.toLowerCase().includes(searchTerm)) relevance += 4;
    
    if (component.demoContext?.keyFeatures?.some(feature => 
      feature.toLowerCase().includes(searchTerm)
    )) relevance += 3;

    return relevance;
  }

  getComponentMetadata(componentId) {
    const loadedComponent = this.loadedComponents.get(componentId);
    if (loadedComponent) {
      return loadedComponent.metadata;
    }

    return this.findComponent(componentId);
  }

  async createComponentInstance(componentId, config = {}) {
    const ComponentClass = await this.loadComponent(componentId);
    const instance = new ComponentClass();
    
    if (config.data) {
      instance.setData(config.data);
    }

    if (config.id) {
      instance.id = config.id;
    }

    return instance;
  }

  getAvailableVerticals() {
    if (!this.libraryIndex || !this.libraryIndex.components) {
      return [];
    }

    const verticals = new Set();
    this.libraryIndex.components.forEach(component => {
      if (component.taxonomy?.advertiserVertical) {
        verticals.add(component.taxonomy.advertiserVertical);
      }
    });

    return Array.from(verticals).sort();
  }

  getAvailableAdTypes() {
    if (!this.libraryIndex || !this.libraryIndex.components) {
      return [];
    }

    const adTypes = new Set();
    this.libraryIndex.components.forEach(component => {
      if (component.taxonomy?.adUnitType) {
        adTypes.add(component.taxonomy.adUnitType);
      }
    });

    return Array.from(adTypes).sort();
  }

  getAvailableDimensions() {
    if (!this.libraryIndex || !this.libraryIndex.components) {
      return [];
    }

    const dimensions = new Set();
    this.libraryIndex.components.forEach(component => {
      if (component.taxonomy?.dimensions) {
        dimensions.add(component.taxonomy.dimensions);
      }
    });

    return Array.from(dimensions).sort();
  }

  async injectComponent(componentId, targetSelector, insertMethod = 'append', config = {}) {
    const ComponentClass = await this.loadComponent(componentId);
    const metadata = this.getComponentMetadata(componentId);
    return window.shadowDOMInjector.injectComponent(
      ComponentClass, 
      targetSelector, 
      insertMethod, 
      config,
      metadata
    );
  }
}

if (typeof window !== 'undefined') {
  window.componentManager = new ComponentManager();
}