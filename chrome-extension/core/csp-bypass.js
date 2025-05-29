class CSPBypass {
  constructor() {
    this.shadowRoots = new WeakSet();
    this.isolatedComponents = new Map();
    this.setupCSPInterception();
  }

  setupCSPInterception() {
    this.interceptCustomElements();
    this.setupShadowDOMProtection();
    this.monitorCSPViolations();
  }

  interceptCustomElements() {
    if (typeof customElements === 'undefined' || !customElements) {
      console.warn('customElements not available, skipping interception');
      return;
    }
    
    const originalDefine = customElements.define;
    
    customElements.define = (name, constructor, options) => {
      if (name.startsWith('firsthand-')) {
        const WrappedConstructor = this.wrapComponentForCSP(constructor);
        return originalDefine.call(customElements, name, WrappedConstructor, options);
      }
      return originalDefine.call(customElements, name, constructor, options);
    };
  }

  wrapComponentForCSP(ComponentClass) {
    const self = this;
    
    return class CSPSafeComponent extends ComponentClass {
      constructor() {
        super();
        self.registerComponent(this);
      }

      connectedCallback() {
        try {
          if (super.connectedCallback) {
            super.connectedCallback();
          }
        } catch (error) {
          if (this.isCSPViolation(error)) {
            this.handleCSPViolation(error);
          } else {
            throw error;
          }
        }
      }

      isCSPViolation(error) {
        const cspIndicators = [
          'Content Security Policy',
          'script-src',
          'unsafe-inline',
          'unsafe-eval',
          'blocked by CSP'
        ];
        
        return cspIndicators.some(indicator => 
          error.message.toLowerCase().includes(indicator.toLowerCase())
        );
      }

      handleCSPViolation(error) {
        console.warn('CSP violation detected, using shadow DOM isolation:', error);
        this.enableStrictIsolation();
      }

      enableStrictIsolation() {
        if (this.shadowRoot) {
          self.shadowRoots.add(this.shadowRoot);
          this.applySafeCSPStyles();
        }
      }

      applySafeCSPStyles() {
        const safeStyle = document.createElement('style');
        safeStyle.textContent = this.generateCSPSafeStyles();
        this.shadowRoot.appendChild(safeStyle);
      }

      generateCSPSafeStyles() {
        return `
          :host {
            all: initial;
            display: block;
            contain: layout style paint size;
            isolation: isolate;
          }
          
          * {
            all: unset;
            display: revert;
            box-sizing: border-box;
          }
          
          :host([hidden]) {
            display: none !important;
          }
        `;
      }
    };
  }

  setupShadowDOMProtection() {
    const originalAttachShadow = Element.prototype.attachShadow;
    
    Element.prototype.attachShadow = function(options) {
      if (this.tagName && this.tagName.toLowerCase().startsWith('firsthand-')) {
        const shadow = originalAttachShadow.call(this, { 
          ...options, 
          mode: 'closed' 
        });
        
        window.cspBypass.shadowRoots.add(shadow);
        window.cspBypass.setupShadowProtection(shadow);
        
        return shadow;
      }
      
      return originalAttachShadow.call(this, options);
    };
  }

  setupShadowProtection(shadowRoot) {
    this.preventEventBubbling(shadowRoot);
    this.isolateScriptExecution(shadowRoot);
    this.protectFromExternal(shadowRoot);
  }

  preventEventBubbling(shadowRoot) {
    const sensitiveEvents = ['click', 'submit', 'change', 'input', 'focus', 'blur'];
    
    sensitiveEvents.forEach(eventType => {
      shadowRoot.addEventListener(eventType, (event) => {
        if (this.isFirsthandComponent(event.target)) {
          event.stopPropagation();
        }
      }, true);
    });
  }

  isolateScriptExecution(shadowRoot) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.tagName === 'SCRIPT') {
            this.makeScriptCSPSafe(node);
          }
        });
      });
    });

    observer.observe(shadowRoot, {
      childList: true,
      subtree: true
    });
  }

  makeScriptCSPSafe(scriptElement) {
    const safeScript = document.createElement('script');
    safeScript.type = 'module';
    
    if (scriptElement.src) {
      if (this.isAllowedSource(scriptElement.src)) {
        safeScript.src = scriptElement.src;
      } else {
        console.warn('Blocked potentially unsafe script source:', scriptElement.src);
        return;
      }
    }
    
    if (scriptElement.textContent) {
      const safeContent = this.sanitizeScriptContent(scriptElement.textContent);
      if (safeContent) {
        safeScript.textContent = safeContent;
      }
    }
    
    scriptElement.parentNode.replaceChild(safeScript, scriptElement);
  }

  isAllowedSource(src) {
    const allowedDomains = [
      chrome.runtime.getURL(''),
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ];
    
    return allowedDomains.some(domain => src.startsWith(domain));
  }

  sanitizeScriptContent(content) {
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(\s*["'].*["']/,
      /setInterval\s*\(\s*["'].*["']/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(content))) {
      console.warn('Blocked potentially unsafe script content');
      return null;
    }
    
    return content;
  }

  protectFromExternal(shadowRoot) {
    const protectedMethods = ['querySelector', 'querySelectorAll', 'getElementById'];
    
    protectedMethods.forEach(method => {
      const original = shadowRoot[method];
      if (original) {
        shadowRoot[method] = function(...args) {
          try {
            return original.apply(this, args);
          } catch (error) {
            console.warn(`Protected shadow DOM access: ${method}`, error);
            return null;
          }
        };
      }
    });
  }

  monitorCSPViolations() {
    document.addEventListener('securitypolicyviolation', (event) => {
      if (this.isFirsthandViolation(event)) {
        this.handleFirsthandCSPViolation(event);
      }
    });

    window.addEventListener('error', (event) => {
      if (event.error && this.isCSPError(event.error)) {
        this.handleCSPError(event.error);
      }
    });
  }

  isFirsthandViolation(event) {
    return event.sourceFile && (
      event.sourceFile.includes('firsthand') ||
      event.sourceFile.includes(chrome.runtime.id)
    );
  }

  isCSPError(error) {
    const cspKeywords = [
      'Content Security Policy',
      'script-src',
      'style-src',
      'unsafe-inline',
      'unsafe-eval'
    ];
    
    return cspKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  handleFirsthandCSPViolation(event) {
    console.warn('Firsthand CSP violation detected:', {
      directive: event.violatedDirective,
      source: event.sourceFile,
      line: event.lineNumber,
      blocked: event.blockedURI
    });

    this.reportViolation({
      type: 'csp-violation',
      directive: event.violatedDirective,
      source: event.sourceFile,
      url: window.location.href,
      timestamp: Date.now()
    });

    this.attemptGracefulRecovery(event);
  }

  handleCSPError(error) {
    console.warn('CSP error in Firsthand component:', error);
    
    this.reportViolation({
      type: 'csp-error',
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  attemptGracefulRecovery(violationEvent) {
    if (violationEvent.violatedDirective === 'style-src') {
      this.recoverFromStyleViolation();
    } else if (violationEvent.violatedDirective === 'script-src') {
      this.recoverFromScriptViolation();
    }
  }

  recoverFromStyleViolation() {
    const firsthandComponents = document.querySelectorAll('[id^="firsthand-component-"]');
    firsthandComponents.forEach(component => {
      if (component.shadowRoot && this.shadowRoots.has(component.shadowRoot)) {
        this.applyFallbackStyles(component.shadowRoot);
      }
    });
  }

  recoverFromScriptViolation() {
    const firsthandComponents = document.querySelectorAll('[id^="firsthand-component-"]');
    firsthandComponents.forEach(component => {
      if (component.enableFallbackMode) {
        component.enableFallbackMode();
      }
    });
  }

  applyFallbackStyles(shadowRoot) {
    const existingStyles = shadowRoot.querySelector('style[data-fallback]');
    if (existingStyles) return;

    const fallbackStyle = document.createElement('style');
    fallbackStyle.setAttribute('data-fallback', 'true');
    fallbackStyle.textContent = this.generateFallbackCSS();
    shadowRoot.appendChild(fallbackStyle);
  }

  generateFallbackCSS() {
    return `
      :host {
        display: block;
        width: 300px;
        height: 250px;
        border: 1px solid #ddd;
        background: #f9f9f9;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 16px;
        box-sizing: border-box;
      }
      
      .fallback-message {
        text-align: center;
        color: #666;
        font-size: 14px;
        margin-top: 50%;
        transform: translateY(-50%);
      }
    `;
  }

  registerComponent(component) {
    const id = component.id || `component-${Date.now()}`;
    this.isolatedComponents.set(id, {
      element: component,
      shadowRoot: component.shadowRoot,
      isolated: true,
      registeredAt: Date.now()
    });
  }

  isFirsthandComponent(element) {
    if (!element || !element.tagName) return false;
    
    return element.tagName.toLowerCase().startsWith('firsthand-') ||
           element.id?.startsWith('firsthand-component-') ||
           this.isolatedComponents.has(element.id);
  }

  reportViolation(violationData) {
    if (window.messageHandler) {
      window.messageHandler.sendMessage('background', 'csp-violation', violationData);
    }
  }

  getIsolationStatus() {
    return {
      totalComponents: this.isolatedComponents.size,
      shadowRoots: this.shadowRoots.size || 0,
      isolated: Array.from(this.isolatedComponents.values()).filter(comp => comp.isolated).length
    };
  }

  createIsolatedContainer(config = {}) {
    const container = document.createElement('div');
    container.className = 'firsthand-isolated-container';
    
    const shadow = container.attachShadow({ mode: 'closed' });
    this.setupShadowProtection(shadow);
    
    const isolationStyles = document.createElement('style');
    isolationStyles.textContent = `
      :host {
        all: initial;
        display: block;
        contain: layout style paint size;
        isolation: isolate;
      }
    `;
    shadow.appendChild(isolationStyles);
    
    return { container, shadow };
  }
}

if (typeof window !== 'undefined') {
  window.cspBypass = new CSPBypass();
}