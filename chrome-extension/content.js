(function() {
  'use strict';

  let isInitialized = false;
  
  function initializeExtension() {
    if (isInitialized) return;
    
    console.log('Firsthand Demo Assistant v2.0 initializing on:', window.location.href);
    
    waitForDependencies()
      .then(() => {
        setupExtensionInterface();
        notifyExtensionReady();
        isInitialized = true;
        console.log('Firsthand Demo Assistant v2.0 ready');
      })
      .catch(error => {
        console.error('Failed to initialize Firsthand Demo Assistant:', error);
      });
  }

  function waitForDependencies(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      function checkDependencies() {
        // Check if we're in a Chrome extension context
        if (typeof chrome === 'undefined' || !chrome.runtime) {
          console.warn('Not running in Chrome extension context');
          resolve(); // Continue without full extension functionality
          return;
        }
        
        if (window.shadowDOMInjector && 
            window.componentManager && 
            window.messageHandler && 
            window.cspBypass) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          console.warn('Extension dependencies not fully loaded, continuing with limited functionality');
          resolve(); // Don't reject, just continue with what we have
          return;
        }
        
        setTimeout(checkDependencies, 100);
      }
      
      checkDependencies();
    });
  }

  function setupExtensionInterface() {
    window.firsthandExtension = {
      version: '2.0',
      
      inject: async (componentId, targetSelector, insertMethod, config) => {
        try {
          return await window.componentManager.injectComponent(
            componentId, 
            targetSelector, 
            insertMethod, 
            config
          );
        } catch (error) {
          console.error('Injection failed:', error);
          throw error;
        }
      },
      
      remove: (componentId) => {
        return window.shadowDOMInjector.removeComponent(componentId);
      },
      
      removeAll: () => {
        return window.shadowDOMInjector.removeAllComponents();
      },
      
      search: (query, filters) => {
        return window.componentManager.searchComponents(query, filters);
      },
      
      validate: (targetSelector) => {
        return window.shadowDOMInjector.validateTargetElement(targetSelector);
      },
      
      getInjected: () => {
        return window.shadowDOMInjector.getInjectedComponents();
      },
      
      waitForElement: (selector, timeout) => {
        return window.shadowDOMInjector.waitForElement(selector, timeout);
      },
      
      getLibraryData: () => {
        return {
          verticals: window.componentManager.getAvailableVerticals(),
          adTypes: window.componentManager.getAvailableAdTypes(),
          dimensions: window.componentManager.getAvailableDimensions()
        };
      },
      
      preload: (componentIds) => {
        return window.componentManager.preloadComponents(componentIds);
      },
      
      getMetadata: (componentId) => {
        return window.componentManager.getComponentMetadata(componentId);
      },
      
      createInstance: (componentId, config) => {
        return window.componentManager.createComponentInstance(componentId, config);
      },
      
      reloadLibrary: () => {
        return window.componentManager.reloadLibraryIndex();
      },
      
      getStatus: () => {
        return {
          ready: isInitialized,
          url: window.location.href,
          injected: window.shadowDOMInjector.getInjectedComponents().length,
          loaded: window.componentManager.getLoadedComponents().length,
          csp: window.cspBypass.getIsolationStatus()
        };
      }
    };

    window.addEventListener('beforeunload', () => {
      window.shadowDOMInjector.removeAllComponents();
    });

    setupKeyboardShortcuts();
    setupDebugInterface();
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleDebugMode();
      }
      
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        window.shadowDOMInjector.removeAllComponents();
        console.log('All Firsthand components cleared');
      }
    });
  }

  function setupDebugInterface() {
    window.firsthandDebug = {
      components: () => window.shadowDOMInjector.getInjectedComponents(),
      loaded: () => window.componentManager.getLoadedComponents(),
      search: (query, filters) => window.componentManager.searchComponents(query, filters),
      inject: window.firsthandExtension.inject,
      remove: window.firsthandExtension.remove,
      status: window.firsthandExtension.getStatus,
      csp: () => window.cspBypass.getIsolationStatus(),
      
      test: async (componentId = 'toyota-suv-interactive-showcase') => {
        try {
          const targets = ['#sidebar', '.sidebar', '[class*="sidebar"]', '.ad-slot', '[class*="ad"]'];
          
          for (const target of targets) {
            const validation = window.shadowDOMInjector.validateTargetElement(target);
            if (validation.valid) {
              console.log(`Testing injection into: ${target}`);
              const injectionId = await window.firsthandExtension.inject(componentId, target);
              console.log(` Successfully injected ${componentId} as ${injectionId}`);
              return injectionId;
            }
          }
          
          console.warn('No suitable target element found for testing');
        } catch (error) {
          console.error('Test injection failed:', error);
        }
      },
      
      clear: () => {
        window.shadowDOMInjector.removeAllComponents();
        console.log('All components removed');
      },
      
      help: () => {
        console.log(`
Firsthand Debug Interface v2.0

Available commands:
  firsthandDebug.components() - List injected components
  firsthandDebug.loaded() - List loaded component classes
  firsthandDebug.search(query, filters) - Search component library
  firsthandDebug.inject(id, target, method, config) - Inject component
  firsthandDebug.remove(id) - Remove specific component
  firsthandDebug.test(componentId) - Test injection with sample component
  firsthandDebug.clear() - Remove all components
  firsthandDebug.status() - Extension status
  firsthandDebug.csp() - CSP isolation status
  firsthandDebug.help() - Show this help

Keyboard shortcuts:
  Ctrl+Shift+F - Toggle debug mode
  Ctrl+Shift+C - Clear all components
        `);
      }
    };
  }

  function toggleDebugMode() {
    const debugMode = document.body.getAttribute('data-firsthand-debug') === 'true';
    document.body.setAttribute('data-firsthand-debug', !debugMode);
    
    if (!debugMode) {
      console.log('Firsthand Debug Mode enabled');
      console.log('Use firsthandDebug.help() for available commands');
    } else {
      console.log('Firsthand Debug Mode disabled');
    }
  }

  function notifyExtensionReady() {
    window.messageHandler.sendWindowMessage('extension-ready', {
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });

    document.dispatchEvent(new CustomEvent('firsthand-extension-ready', {
      detail: {
        version: '2.0',
        api: window.firsthandExtension
      }
    }));
  }

  function detectPageType() {
    const indicators = {
      cms: ['wordpress', 'drupal', 'joomla'],
      publisher: ['article', 'news', 'blog', 'magazine'],
      ecommerce: ['shop', 'store', 'cart', 'product'],
      social: ['facebook', 'twitter', 'instagram', 'linkedin']
    };

    const url = window.location.href.toLowerCase();
    const content = document.documentElement.innerHTML.toLowerCase();

    for (const [type, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword => url.includes(keyword) || content.includes(keyword))) {
        return type;
      }
    }

    return 'unknown';
  }

  function detectAdSlots() {
    const adSelectors = [
      '[id*="ad"]',
      '[class*="ad"]',
      '[id*="banner"]', 
      '[class*="banner"]',
      '[id*="sidebar"]',
      '[class*="sidebar"]',
      '.widget-area',
      '.advertisement',
      '[data-ad]',
      '.google-ads',
      '.adsystem'
    ];

    const potentialSlots = [];
    
    adSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element.offsetWidth > 100 && element.offsetHeight > 100) {
            potentialSlots.push({
              selector: this.generateUniqueSelector(element),
              dimensions: {
                width: element.offsetWidth,
                height: element.offsetHeight
              },
              position: element.getBoundingClientRect()
            });
          }
        });
      } catch (error) {
        console.warn(`Failed to query selector ${selector}:`, error);
      }
    });

    return potentialSlots;
  }

  function generateUniqueSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(cls => cls.length > 0);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    const tag = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        return `${tag}:nth-of-type(${index})`;
      }
    }
    
    return tag;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }

  const pageType = detectPageType();
  console.log(`Page type detected: ${pageType}`);

})();