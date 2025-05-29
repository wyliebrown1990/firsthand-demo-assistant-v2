class MessageHandler {
  constructor() {
    this.listeners = new Map();
    this.messageQueue = [];
    this.isReady = false;
    this.setupMessageListeners();
    this.setupCustomEventListeners();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    window.addEventListener('message', (event) => {
      if (event.source === window && event.data.source === 'firsthand-extension') {
        this.handleWindowMessage(event.data);
      }
    });
  }

  setupCustomEventListeners() {
    document.addEventListener('firsthand-component-injected', (event) => {
      this.sendMessage('popup', 'component-injected', event.detail);
    });

    document.addEventListener('firsthand-component-removed', (event) => {
      this.sendMessage('popup', 'component-removed', event.detail);
    });

    document.addEventListener('firsthand-injection-error', (event) => {
      this.sendMessage('popup', 'injection-error', event.detail);
    });

    document.addEventListener('ad-interaction', (event) => {
      this.handleAdInteraction(event.detail);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      const { action, data, target } = message;

      switch (action) {
        case 'ping':
          sendResponse({ status: 'ready' });
          break;

        case 'inject-component':
          await this.handleInjectComponent(data, sendResponse);
          break;

        case 'remove-component':
          await this.handleRemoveComponent(data, sendResponse);
          break;

        case 'remove-all-components':
          await this.handleRemoveAllComponents(sendResponse);
          break;

        case 'get-injected-components':
          await this.handleGetInjectedComponents(sendResponse);
          break;

        case 'search-components':
          await this.handleSearchComponents(data, sendResponse);
          break;

        case 'get-component-metadata':
          await this.handleGetComponentMetadata(data, sendResponse);
          break;

        case 'validate-target':
          await this.handleValidateTarget(data, sendResponse);
          break;

        case 'get-library-data':
          await this.handleGetLibraryData(sendResponse);
          break;

        case 'preload-components':
          await this.handlePreloadComponents(data, sendResponse);
          break;

        case 'reload-library':
          await this.handleReloadLibrary(sendResponse);
          break;

        default:
          sendResponse({ error: `Unknown action: ${action}` });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ error: error.message });
    }
  }

  handleWindowMessage(data) {
    const { action, payload } = data;
    
    switch (action) {
      case 'component-ready':
        this.notifyComponentReady(payload);
        break;
      case 'component-error':
        this.notifyComponentError(payload);
        break;
    }
  }

  async handleInjectComponent(data, sendResponse) {
    try {
      const { componentId, targetSelector, insertMethod, config } = data;
      
      const injectionId = await window.componentManager.injectComponent(
        componentId,
        targetSelector,
        insertMethod,
        config
      );

      sendResponse({
        success: true,
        injectionId,
        componentId,
        targetSelector
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleRemoveComponent(data, sendResponse) {
    try {
      const { componentId } = data;
      const result = window.shadowDOMInjector.removeComponent(componentId);
      
      sendResponse({
        success: result,
        componentId
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleRemoveAllComponents(sendResponse) {
    try {
      const result = window.shadowDOMInjector.removeAllComponents();
      
      sendResponse({
        success: result
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleGetInjectedComponents(sendResponse) {
    try {
      const components = window.shadowDOMInjector.getInjectedComponents();
      
      sendResponse({
        success: true,
        components
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleSearchComponents(data, sendResponse) {
    try {
      const { query, filters } = data;
      const results = window.componentManager.searchComponents(query, filters);
      
      sendResponse({
        success: true,
        results,
        query,
        filters
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleGetComponentMetadata(data, sendResponse) {
    try {
      const { componentId } = data;
      const metadata = window.componentManager.getComponentMetadata(componentId);
      
      sendResponse({
        success: true,
        metadata
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleValidateTarget(data, sendResponse) {
    try {
      const { targetSelector } = data;
      const validation = window.shadowDOMInjector.validateTargetElement(targetSelector);
      
      sendResponse({
        success: true,
        validation
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleGetLibraryData(sendResponse) {
    try {
      const verticals = window.componentManager.getAvailableVerticals();
      const adTypes = window.componentManager.getAvailableAdTypes();
      const dimensions = window.componentManager.getAvailableDimensions();
      
      sendResponse({
        success: true,
        verticals,
        adTypes,
        dimensions
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handlePreloadComponents(data, sendResponse) {
    try {
      const { componentIds } = data;
      const loadedComponents = await window.componentManager.preloadComponents(componentIds);
      
      sendResponse({
        success: true,
        loadedCount: loadedComponents.length,
        requestedCount: componentIds.length
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  async handleReloadLibrary(sendResponse) {
    try {
      await window.componentManager.reloadLibraryIndex();
      
      sendResponse({
        success: true
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  handleAdInteraction(interactionData) {
    const { action, data, componentId } = interactionData;
    
    this.sendMessage('popup', 'ad-interaction', {
      action,
      data,
      componentId,
      timestamp: Date.now(),
      url: window.location.href
    });

    this.sendMessage('background', 'track-interaction', {
      action,
      componentId,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  sendMessage(target, action, data) {
    const message = {
      source: 'firsthand-content',
      target,
      action,
      data,
      timestamp: Date.now()
    };

    if (target === 'background') {
      chrome.runtime.sendMessage(message).catch(error => {
        console.warn('Failed to send message to background:', error);
      });
    } else if (target === 'popup') {
      chrome.runtime.sendMessage(message).catch(error => {
        console.warn('Failed to send message to popup:', error);
      });
    }
  }

  sendWindowMessage(action, payload) {
    window.postMessage({
      source: 'firsthand-extension',
      action,
      payload
    }, '*');
  }

  notifyComponentReady(payload) {
    this.sendMessage('popup', 'component-ready', payload);
  }

  notifyComponentError(payload) {
    this.sendMessage('popup', 'component-error', payload);
  }

  addListener(action, callback) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, []);
    }
    this.listeners.get(action).push(callback);
  }

  removeListener(action, callback) {
    if (this.listeners.has(action)) {
      const callbacks = this.listeners.get(action);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  broadcastToComponents(action, data) {
    const event = new CustomEvent(`firsthand-${action}`, {
      detail: data,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  async waitForExtensionReady(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (window.componentManager && window.shadowDOMInjector) {
          this.isReady = true;
          resolve();
        }
      };

      checkReady();

      if (!this.isReady) {
        const interval = setInterval(() => {
          checkReady();
          if (this.isReady) {
            clearInterval(interval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(interval);
          if (!this.isReady) {
            reject(new Error('Extension not ready within timeout'));
          }
        }, timeout);
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.messageHandler = new MessageHandler();
}