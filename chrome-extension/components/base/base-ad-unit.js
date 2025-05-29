class BaseAdUnit extends HTMLElement {
  constructor() {
    super();
    
    this.attachShadow({ mode: 'closed' });
    
    this.state = {
      currentStep: 'initial',
      selectedOptions: {},
      userData: {},
      isLoaded: false,
      isInteracting: false
    };
    
    this.data = {};
    this.analytics = {
      impressions: 0,
      interactions: 0,
      clickThroughs: 0,
      startTime: null,
      lastInteraction: null
    };
    
    this.eventListeners = new Map();
    this.observers = [];
    
    this.init();
  }

  init() {
    this.setupBaseStyles();
    this.setupAnalytics();
    this.setupAccessibility();
  }

  connectedCallback() {
    this.analytics.startTime = Date.now();
    this.trackImpression();
    this.render();
    this.attachEventListeners();
    this.setupIntersectionObserver();
    this.setState({ isLoaded: true });
    this.dispatchReadyEvent();
  }

  disconnectedCallback() {
    this.cleanup();
    this.removeEventListeners();
    this.observers.forEach(observer => observer.disconnect());
  }

  setupBaseStyles() {
    const baseStyle = document.createElement('style');
    baseStyle.textContent = this.getBaseStyles();
    this.shadowRoot.appendChild(baseStyle);
  }

  getBaseStyles() {
    return `
      :host {
        display: block;
        width: ${this.getWidth()};
        height: ${this.getHeight()};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        contain: layout style paint size;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      :host([hidden]) {
        display: none !important;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .ad-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-size: 14px;
      }
      
      .error-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #d93025;
        font-size: 14px;
        text-align: center;
        padding: 16px;
      }
      
      .interaction-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.02);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }
      
      :host(.interacting) .interaction-overlay {
        opacity: 1;
      }
      
      .cta-button {
        background: #1a73e8;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        min-height: 44px;
      }
      
      .cta-button:hover {
        background: #1557b0;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
      }
      
      .cta-button:active {
        transform: translateY(0);
      }
      
      .cta-button:disabled {
        background: #dadce0;
        color: #5f6368;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .progress-indicator {
        display: flex;
        gap: 4px;
        justify-content: center;
        padding: 8px;
      }
      
      .progress-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #dadce0;
        transition: background 0.2s ease;
      }
      
      .progress-dot.active {
        background: #1a73e8;
      }
      
      .progress-dot.completed {
        background: #34a853;
      }
      
      @media (max-width: 480px) {
        :host {
          border-radius: 4px;
        }
        
        .cta-button {
          padding: 12px 16px;
          font-size: 16px;
        }
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      @media (prefers-color-scheme: dark) {
        :host {
          background: #1f1f1f;
          color: #e8eaed;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .cta-button {
          background: #8ab4f8;
          color: #202124;
        }
        
        .cta-button:hover {
          background: #aecbfa;
        }
      }
    `;
  }

  getWidth() {
    return this.getAttribute('width') || '300px';
  }

  getHeight() {
    return this.getAttribute('height') || '250px';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.getBaseStyles()}${this.getStyles()}</style>
      <div class="ad-container">
        ${this.getTemplate()}
      </div>
      <div class="interaction-overlay"></div>
    `;
    
    this.setupComponentEventListeners();
  }

  getStyles() {
    return '';
  }

  getTemplate() {
    return `
      <div class="loading-state">
        <p>Loading...</p>
      </div>
    `;
  }

  setupComponentEventListeners() {
    // Override in child classes
  }

  attachEventListeners() {
    // Global event listeners that apply to all components
    this.addEventListener('click', this.handleClick.bind(this));
    this.addEventListener('keydown', this.handleKeydown.bind(this));
    this.addEventListener('focus', this.handleFocus.bind(this));
    this.addEventListener('blur', this.handleBlur.bind(this));
  }

  removeEventListeners() {
    this.eventListeners.forEach((listener, element) => {
      element.removeEventListener(listener.event, listener.handler);
    });
    this.eventListeners.clear();
  }

  addManagedEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.set(element, { event, handler });
  }

  handleClick(event) {
    this.trackInteraction('click', {
      target: event.target.tagName,
      position: { x: event.clientX, y: event.clientY }
    });
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target.classList.contains('cta-button') || event.target.hasAttribute('tabindex')) {
        event.preventDefault();
        this.handleClick(event);
      }
    }
  }

  handleFocus(event) {
    this.classList.add('keyboard-focused');
  }

  handleBlur(event) {
    this.classList.remove('keyboard-focused');
  }

  handleUserInteraction(action, data = {}) {
    this.setState({ isInteracting: true });
    this.classList.add('interacting');
    
    setTimeout(() => {
      this.classList.remove('interacting');
      this.setState({ isInteracting: false });
    }, 200);

    this.updateState(action, data);
    this.trackInteraction(action, data);
    
    this.dispatchEvent(new CustomEvent('ad-interaction', {
      detail: {
        action,
        data,
        componentId: this.id,
        timestamp: Date.now(),
        state: { ...this.state }
      },
      bubbles: true
    }));
  }

  updateState(action, data) {
    // Override in child classes to handle specific state updates
    this.setState({ 
      selectedOptions: { ...this.state.selectedOptions, ...data }
    });
  }

  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange(prevState, this.state);
  }

  onStateChange(prevState, newState) {
    // Override in child classes to handle state changes
  }

  setData(data) {
    this.data = { ...this.data, ...data };
    if (this.state.isLoaded) {
      this.render();
    }
  }

  setupAnalytics() {
    this.analytics.sessionId = this.generateSessionId();
    this.analytics.componentId = this.tagName.toLowerCase();
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  trackImpression() {
    this.analytics.impressions++;
    this.sendAnalyticsEvent('impression', {
      sessionId: this.analytics.sessionId,
      componentId: this.analytics.componentId,
      timestamp: Date.now(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  trackInteraction(action, data = {}) {
    this.analytics.interactions++;
    this.analytics.lastInteraction = Date.now();
    
    this.sendAnalyticsEvent('interaction', {
      sessionId: this.analytics.sessionId,
      componentId: this.analytics.componentId,
      action,
      data,
      timestamp: Date.now(),
      interactionCount: this.analytics.interactions
    });
  }

  trackClickThrough(destination) {
    this.analytics.clickThroughs++;
    
    this.sendAnalyticsEvent('click-through', {
      sessionId: this.analytics.sessionId,
      componentId: this.analytics.componentId,
      destination,
      timestamp: Date.now(),
      timeOnComponent: Date.now() - this.analytics.startTime
    });
  }

  sendAnalyticsEvent(eventType, data) {
    const event = new CustomEvent('ad-analytics', {
      detail: { eventType, data },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  setupAccessibility() {
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', this.getAccessibilityLabel());
    
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
  }

  getAccessibilityLabel() {
    return `Interactive advertisement: ${this.constructor.name}`;
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.onVisible();
        } else {
          this.onHidden();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(this);
    this.observers.push(observer);
  }

  onVisible() {
    this.classList.add('visible');
    this.sendAnalyticsEvent('viewable', {
      sessionId: this.analytics.sessionId,
      timestamp: Date.now()
    });
  }

  onHidden() {
    this.classList.remove('visible');
  }

  dispatchReadyEvent() {
    this.dispatchEvent(new CustomEvent('component-ready', {
      detail: {
        componentId: this.id,
        className: this.constructor.name,
        timestamp: Date.now()
      },
      bubbles: true
    }));
  }

  showError(message) {
    this.shadowRoot.innerHTML = `
      <style>${this.getBaseStyles()}</style>
      <div class="ad-container">
        <div class="error-state">
          <p>${message}</p>
        </div>
      </div>
    `;
  }

  showLoading() {
    const container = this.shadowRoot.querySelector('.ad-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <p>Loading...</p>
        </div>
      `;
    }
  }

  hideLoading() {
    const loadingState = this.shadowRoot.querySelector('.loading-state');
    if (loadingState) {
      loadingState.style.display = 'none';
    }
  }

  animateIn() {
    this.style.opacity = '0';
    this.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
      this.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      this.style.opacity = '1';
      this.style.transform = 'translateY(0)';
    });
  }

  animateOut() {
    return new Promise(resolve => {
      this.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      this.style.opacity = '0';
      this.style.transform = 'translateY(-20px)';
      
      setTimeout(resolve, 300);
    });
  }

  enableFallbackMode() {
    this.classList.add('fallback-mode');
    this.shadowRoot.innerHTML = `
      <style>${this.getBaseStyles()}</style>
      <div class="ad-container">
        <div style="padding: 16px; text-align: center; color: #666;">
          <p>Interactive ad experience</p>
          <button class="cta-button" onclick="window.open('${this.getFallbackURL()}', '_blank')">
            Learn More
          </button>
        </div>
      </div>
    `;
  }

  getFallbackURL() {
    return this.getAttribute('fallback-url') || '#';
  }

  cleanup() {
    // Override in child classes for component-specific cleanup
  }

  getAnalytics() {
    return {
      ...this.analytics,
      engagementTime: this.analytics.lastInteraction ? 
        this.analytics.lastInteraction - this.analytics.startTime : 0,
      interactionRate: this.analytics.impressions > 0 ? 
        this.analytics.interactions / this.analytics.impressions : 0
    };
  }

  static get observedAttributes() {
    return ['width', 'height', 'data-config'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-config' && newValue) {
      try {
        const config = JSON.parse(newValue);
        this.setData(config);
      } catch (error) {
        console.warn('Invalid data-config JSON:', error);
      }
    }
    
    if ((name === 'width' || name === 'height') && this.shadowRoot) {
      this.render();
    }
  }
}

if (typeof window !== 'undefined') {
  window.BaseAdUnit = BaseAdUnit;
}

export default BaseAdUnit;