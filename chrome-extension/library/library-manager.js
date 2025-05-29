class LibraryManager {
  constructor() {
    this.libraryIndex = null;
    this.searchEngine = new ComponentSearchEngine();
    this.componentLoader = new ComponentLoader();
    this.componentMap = new Map();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeInternal();
    return this.initializationPromise;
  }

  async _initializeInternal() {
    try {
      console.log('Initializing Firsthand Component Library...');
      
      // Load the library index
      await this.loadLibraryIndex();
      
      // Initialize search engine
      await this.searchEngine.initialize(this.libraryIndex);
      
      // Build component map for faster lookups
      this.buildComponentMap();
      
      // Preload popular components if configured
      await this.preloadPopularComponents();
      
      this.isInitialized = true;
      console.log('Component library initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize component library:', error);
      throw error;
    }
  }

  async loadLibraryIndex() {
    try {
      const indexURL = chrome.runtime.getURL('library/library-index.json');
      const response = await fetch(indexURL);
      
      if (!response.ok) {
        throw new Error(`Failed to load library index: ${response.status}`);
      }
      
      this.libraryIndex = await response.json();
      console.log(`Loaded library index with ${this.libraryIndex.components.length} components`);
      
    } catch (error) {
      console.error('Error loading library index:', error);
      // Fallback to empty library
      this.libraryIndex = {
        version: '2.0',
        components: [],
        categories: {
          advertiserVerticals: [],
          adUnitTypes: [],
          dimensions: [],
          interactionLevels: []
        }
      };
    }
  }

  buildComponentMap() {
    this.componentMap.clear();
    
    if (this.libraryIndex && this.libraryIndex.components) {
      this.libraryIndex.components.forEach(component => {
        this.componentMap.set(component.id, component);
      });
    }
    
    console.log(`Built component map with ${this.componentMap.size} entries`);
  }

  async preloadPopularComponents() {
    if (!this.libraryIndex.popularComponents || this.libraryIndex.popularComponents.length === 0) {
      return;
    }

    try {
      console.log('Preloading popular components...');
      const results = await this.componentLoader.preloadComponents(
        this.libraryIndex.popularComponents,
        this.componentMap
      );
      
      console.log(`Preloaded ${results.successful.length} popular components`);
      if (results.failed.length > 0) {
        console.warn(`Failed to preload ${results.failed.length} components:`, results.failed);
      }
    } catch (error) {
      console.warn('Error during popular component preloading:', error);
    }
  }

  async searchComponents(query, filters = {}) {
    await this.initialize();
    return this.searchEngine.search(query, filters);
  }

  async getComponent(componentId) {
    await this.initialize();
    return this.componentMap.get(componentId);
  }

  async loadComponent(componentId) {
    await this.initialize();
    
    const componentInfo = this.componentMap.get(componentId);
    if (!componentInfo) {
      throw new Error(`Component not found in library: ${componentId}`);
    }

    return await this.componentLoader.loadComponent(componentId, componentInfo.path);
  }

  async createComponentInstance(componentId, config = {}) {
    const ComponentClass = await this.loadComponent(componentId);
    return this.componentLoader.createComponentInstance(componentId, {
      ...config,
      ComponentClass
    });
  }

  getCategories() {
    if (!this.libraryIndex) return {};
    return this.libraryIndex.categories || {};
  }

  getAvailableVerticals() {
    const categories = this.getCategories();
    return categories.advertiserVerticals || [];
  }

  getAvailableAdTypes() {
    const categories = this.getCategories();
    return categories.adUnitTypes || [];
  }

  getAvailableDimensions() {
    const categories = this.getCategories();
    return categories.dimensions || [];
  }

  getQuickFilters() {
    if (!this.libraryIndex) return {};
    return this.libraryIndex.quickFilters || {};
  }

  async applyQuickFilter(filterType) {
    await this.initialize();
    return this.searchEngine.getQuickFilterResults(filterType);
  }

  async getSuggestions(partialQuery) {
    await this.initialize();
    return this.searchEngine.getSuggestions(partialQuery);
  }

  getFeaturedComponents() {
    if (!this.libraryIndex) return [];
    return this.libraryIndex.featuredComponents || [];
  }

  getRecentlyAdded() {
    if (!this.libraryIndex) return [];
    return this.libraryIndex.recentlyAdded || [];
  }

  getPopularComponents() {
    if (!this.libraryIndex) return [];
    return this.libraryIndex.popularComponents || [];
  }

  async validateComponent(componentId) {
    const ComponentClass = await this.loadComponent(componentId);
    return this.componentLoader.validateComponent(ComponentClass, componentId);
  }

  getLibraryStats() {
    if (!this.libraryIndex) {
      return {
        totalComponents: 0,
        categories: 0,
        lastUpdated: null
      };
    }

    return {
      totalComponents: this.libraryIndex.totalComponents || 0,
      categories: Object.keys(this.getCategories()).length,
      lastUpdated: this.libraryIndex.lastUpdated,
      version: this.libraryIndex.version,
      librarySize: this.libraryIndex.metadata?.librarySize,
      cspComplianceRate: this.libraryIndex.metadata?.cspComplianceRate,
      accessibilityCompliance: this.libraryIndex.metadata?.accessibilityCompliance
    };
  }

  getLoadedComponents() {
    return this.componentLoader.getLoadedComponents();
  }

  getLoadingStatus() {
    return this.componentLoader.getLoadingStatus();
  }

  async reloadLibrary() {
    console.log('Reloading component library...');
    
    // Clear current state
    this.isInitialized = false;
    this.initializationPromise = null;
    this.componentMap.clear();
    this.libraryIndex = null;
    
    // Clear loader cache
    this.componentLoader.clearCache();
    
    // Reinitialize
    await this.initialize();
    
    console.log('Component library reloaded successfully');
  }

  async updateUsageStatistics(componentId, eventType, data = {}) {
    // Update local usage statistics
    const usageEvent = {
      componentId,
      eventType, // 'injection', 'interaction', 'completion'
      data,
      timestamp: Date.now(),
      url: window.location?.href
    };

    // Store in local storage for analytics
    try {
      const storageKey = 'firsthand-usage-stats';
      const existing = await this._getFromStorage(storageKey) || [];
      existing.push(usageEvent);
      
      // Keep only last 1000 events
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      await this._setToStorage(storageKey, existing);
    } catch (error) {
      console.warn('Failed to update usage statistics:', error);
    }
  }

  async getUsageStatistics() {
    try {
      const storageKey = 'firsthand-usage-stats';
      const events = await this._getFromStorage(storageKey) || [];
      
      const stats = {
        totalEvents: events.length,
        componentUsage: {},
        eventTypes: {},
        timeRange: {
          earliest: events.length > 0 ? Math.min(...events.map(e => e.timestamp)) : null,
          latest: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : null
        }
      };

      events.forEach(event => {
        // Count by component
        if (!stats.componentUsage[event.componentId]) {
          stats.componentUsage[event.componentId] = 0;
        }
        stats.componentUsage[event.componentId]++;

        // Count by event type
        if (!stats.eventTypes[event.eventType]) {
          stats.eventTypes[event.eventType] = 0;
        }
        stats.eventTypes[event.eventType]++;
      });

      return stats;
    } catch (error) {
      console.warn('Failed to get usage statistics:', error);
      return { totalEvents: 0, componentUsage: {}, eventTypes: {} };
    }
  }

  async exportLibraryData() {
    const data = {
      libraryIndex: this.libraryIndex,
      loadedComponents: this.getLoadedComponents(),
      usageStatistics: await this.getUsageStatistics(),
      searchAnalytics: this.searchEngine.getSearchAnalytics(),
      timestamp: Date.now(),
      version: '2.0'
    };

    return data;
  }

  async _getFromStorage(key) {
    return new Promise((resolve) => {
      if (chrome?.storage?.local) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key]);
        });
      } else {
        // Fallback to localStorage
        try {
          const item = localStorage.getItem(key);
          resolve(item ? JSON.parse(item) : null);
        } catch (error) {
          resolve(null);
        }
      }
    });
  }

  async _setToStorage(key, value) {
    return new Promise((resolve, reject) => {
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } else {
        // Fallback to localStorage
        try {
          localStorage.setItem(key, JSON.stringify(value));
          resolve();
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  enableDebugMode() {
    this.componentLoader.enableDebugMode();
    
    // Add library debug interface
    window.libraryDebug = {
      getLibraryStats: () => this.getLibraryStats(),
      searchComponents: (query, filters) => this.searchComponents(query, filters),
      getComponent: (id) => this.getComponent(id),
      loadComponent: (id) => this.loadComponent(id),
      getLoadedComponents: () => this.getLoadedComponents(),
      reloadLibrary: () => this.reloadLibrary(),
      getUsageStats: () => this.getUsageStatistics(),
      exportData: () => this.exportLibraryData(),
      validateComponent: (id) => this.validateComponent(id),
      
      // Search engine debug
      getSearchAnalytics: () => this.searchEngine.getSearchAnalytics(),
      clearSearchHistory: () => this.searchEngine.clearSearchHistory(),
      
      help: () => {
        console.log(`
Firsthand Library Debug Interface

Available commands:
  libraryDebug.getLibraryStats() - Library statistics
  libraryDebug.searchComponents(query, filters) - Search components
  libraryDebug.getComponent(id) - Get component metadata
  libraryDebug.loadComponent(id) - Load component class
  libraryDebug.getLoadedComponents() - List loaded components
  libraryDebug.reloadLibrary() - Reload entire library
  libraryDebug.getUsageStats() - Usage analytics
  libraryDebug.exportData() - Export all library data
  libraryDebug.validateComponent(id) - Validate component
  libraryDebug.getSearchAnalytics() - Search analytics
  libraryDebug.clearSearchHistory() - Clear search history
        `);
      }
    };
  }

  async warmCache() {
    const popularComponents = this.getPopularComponents();
    if (popularComponents.length > 0) {
      return await this.componentLoader.warmCache(popularComponents, this.componentMap);
    }
    return { successful: [], failed: [] };
  }

  onLibraryUpdate(callback) {
    // Set up listener for library updates
    // This could listen for file changes, remote updates, etc.
    this._updateCallbacks = this._updateCallbacks || [];
    this._updateCallbacks.push(callback);
  }

  _notifyLibraryUpdate() {
    if (this._updateCallbacks) {
      this._updateCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.warn('Error in library update callback:', error);
        }
      });
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.LibraryManager = LibraryManager;
  
  // Auto-initialize if not already done
  if (!window.libraryManager) {
    window.libraryManager = new LibraryManager();
  }
}

export default LibraryManager;