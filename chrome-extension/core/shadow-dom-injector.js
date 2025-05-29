class ShadowDOMInjector {
  constructor() {
    this.injectedComponents = new Map();
    this.injectionCounter = 0;
  }

  injectComponent(componentClass, targetSelector, insertMethod = 'append', config = {}, metadata = null) {
    try {
      const targetElement = this.findTargetElement(targetSelector);
      if (!targetElement) {
        throw new Error(`Target element not found: ${targetSelector}`);
      }

      const componentId = `firsthand-component-${++this.injectionCounter}`;
      
      // Create a wrapper div that will contain our component content
      const componentElement = document.createElement('div');
      componentElement.className = 'firsthand-component-wrapper';
      
      // Initialize the component's basic structure and content with metadata
      this.initializeComponentContent(componentElement, componentClass, metadata);
      componentElement.id = componentId;
      
      if (config.data && typeof componentElement.setData === 'function') {
        componentElement.setData(config.data);
      }

      this.insertComponent(componentElement, targetElement, insertMethod);
      
      this.injectedComponents.set(componentId, {
        element: componentElement,
        targetSelector,
        insertMethod,
        componentClass: componentClass.name
      });

      this.dispatchInjectionEvent('component-injected', {
        componentId,
        targetSelector,
        componentClass: componentClass.name
      });

      return componentId;
    } catch (error) {
      console.error('Component injection failed:', error);
      this.dispatchInjectionEvent('injection-error', {
        error: error.message,
        targetSelector,
        componentClass: componentClass?.name
      });
      throw error;
    }
  }

  findTargetElement(selector) {
    if (selector.startsWith('#')) {
      return document.getElementById(selector.slice(1));
    }
    
    return document.querySelector(selector);
  }

  insertComponent(componentElement, targetElement, method) {
    switch (method) {
      case 'append':
        targetElement.appendChild(componentElement);
        break;
      case 'prepend':
        targetElement.insertBefore(componentElement, targetElement.firstChild);
        break;
      case 'before':
        targetElement.parentNode.insertBefore(componentElement, targetElement);
        break;
      case 'after':
        targetElement.parentNode.insertBefore(componentElement, targetElement.nextSibling);
        break;
      case 'replace':
        targetElement.parentNode.replaceChild(componentElement, targetElement);
        break;
      default:
        targetElement.appendChild(componentElement);
    }
  }

  removeComponent(componentId) {
    const componentInfo = this.injectedComponents.get(componentId);
    if (!componentInfo) {
      console.warn(`Component not found: ${componentId}`);
      return false;
    }

    try {
      if (componentInfo.element.parentNode) {
        componentInfo.element.parentNode.removeChild(componentInfo.element);
      }
      
      this.injectedComponents.delete(componentId);
      
      this.dispatchInjectionEvent('component-removed', {
        componentId,
        componentClass: componentInfo.componentClass
      });

      return true;
    } catch (error) {
      console.error('Component removal failed:', error);
      return false;
    }
  }

  removeAllComponents() {
    const componentIds = Array.from(this.injectedComponents.keys());
    const results = componentIds.map(id => this.removeComponent(id));
    return results.every(result => result === true);
  }

  getInjectedComponents() {
    return Array.from(this.injectedComponents.entries()).map(([id, info]) => ({
      id,
      targetSelector: info.targetSelector,
      insertMethod: info.insertMethod,
      componentClass: info.componentClass,
      isConnected: info.element.isConnected
    }));
  }

  injectFromLibrary(componentId, targetSelector, insertMethod = 'append', config = {}) {
    return new Promise((resolve, reject) => {
      window.componentManager.loadComponent(componentId)
        .then(ComponentClass => {
          const injectionId = this.injectComponent(ComponentClass, targetSelector, insertMethod, config);
          resolve(injectionId);
        })
        .catch(error => {
          console.error('Failed to inject component from library:', error);
          reject(error);
        });
    });
  }

  validateTargetElement(selector) {
    try {
      const element = this.findTargetElement(selector);
      return {
        valid: !!element,
        exists: !!element,
        selector: selector,
        tagName: element?.tagName?.toLowerCase(),
        dimensions: element ? {
          width: element.offsetWidth,
          height: element.offsetHeight
        } : null
      };
    } catch (error) {
      return {
        valid: false,
        exists: false,
        selector: selector,
        error: error.message
      };
    }
  }

  createShadowContainer(config = {}) {
    const container = document.createElement('div');
    container.className = 'firsthand-shadow-container';
    
    if (config.styles) {
      Object.assign(container.style, config.styles);
    }

    if (config.id) {
      container.id = config.id;
    }

    const shadow = container.attachShadow({ mode: 'closed' });
    
    if (config.isolateStyles !== false) {
      const styleReset = document.createElement('style');
      styleReset.textContent = `
        :host {
          all: initial;
          display: block;
          contain: layout style paint size;
        }
        * {
          box-sizing: border-box;
        }
      `;
      shadow.appendChild(styleReset);
    }

    return { container, shadow };
  }

  dispatchInjectionEvent(eventType, detail) {
    const event = new CustomEvent(`firsthand-${eventType}`, {
      detail,
      bubbles: true,
      cancelable: false
    });
    document.dispatchEvent(event);
  }

  observeTargetChanges(targetSelector, callback) {
    const targetElement = this.findTargetElement(targetSelector);
    if (!targetElement) return null;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        callback(mutation, targetElement);
      });
    });

    observer.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });

    return observer;
  }

  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = this.findTargetElement(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = this.findTargetElement(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found within timeout: ${selector}`));
      }, timeout);
    });
  }

  initializeComponentContent(wrapper, componentClass, metadata = null) {
    // Parse dimensions from metadata or use defaults
    const dimensions = this.parseDimensions(metadata?.taxonomy?.dimensions || '300x600');
    
    // Check if component has a template method for rich interactive content
    if (typeof componentClass.getTemplate === 'function') {
      const template = componentClass.getTemplate(dimensions);
      this.renderRichComponent(wrapper, template, componentClass, dimensions);
    } else if (componentClass.name === 'ToyotaSUVShowcase') {
      // Rich interactive Toyota SUV showcase with flexible dimensions
      this.renderToyotaSUVShowcase(wrapper, dimensions);
    } else if (componentClass.name === 'XboxGamePassQuiz') {
      // Xbox Game Pass Interactive Quiz component
      this.renderXboxComponent(wrapper, componentClass, dimensions);
    } else {
      // Generic fallback with flexible dimensions
      this.renderGenericComponent(wrapper, componentClass, dimensions);
    }
  }

  parseDimensions(dimensionString) {
    // Parse dimension string like "300x600", "728x90", etc.
    const parts = dimensionString.split('x');
    return {
      width: parseInt(parts[0]) || 300,
      height: parseInt(parts[1]) || 600
    };
  }

  renderGenericComponent(wrapper, componentClass, dimensions) {
    wrapper.innerHTML = `
      <div class="fh-generic-component" style="
        all: initial;
        box-sizing: border-box !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        position: relative !important;
        width: ${dimensions.width}px !important;
        height: ${dimensions.height}px !important;
        min-width: ${dimensions.width}px !important;
        min-height: ${dimensions.height}px !important;
        max-width: ${dimensions.width}px !important;
        max-height: ${dimensions.height}px !important;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
        border: 1px solid #dee2e6 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        color: #495057 !important;
        margin: 0 !important;
        padding: 20px !important;
        cursor: default !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        contain: layout style paint size !important;
        isolation: isolate !important;
      ">
        <h4 style="
          margin: 0 0 12px 0 !important;
          font-size: ${Math.min(18, dimensions.width / 20)}px !important;
          font-weight: 600 !important;
          color: #343a40 !important;
        ">Component: ${componentClass.name}</h4>
        <p style="
          margin: 0 !important;
          font-size: ${Math.min(14, dimensions.width / 25)}px !important;
          line-height: 1.4 !important;
          color: #6c757d !important;
        ">This is a placeholder for the ${componentClass.name} component.</p>
        <div style="
          margin-top: 12px !important;
          font-size: ${Math.min(12, dimensions.width / 30)}px !important;
          color: #868e96 !important;
        ">${dimensions.width}×${dimensions.height}px</div>
      </div>
    `;
  }

  renderRichComponent(wrapper, template, componentClass, dimensions) {
    // Set the HTML content
    wrapper.innerHTML = template.html;
    
    // Create isolated context for component JavaScript
    const componentContext = {
      element: wrapper,
      componentClass: componentClass,
      dimensions: dimensions
    };
    
    // Execute component JavaScript in isolated context
    if (template.javascript) {
      try {
        // Create a function that runs in the component's context
        const scriptFunction = new Function('context', 'element', template.javascript);
        scriptFunction(componentContext, wrapper);
      } catch (error) {
        console.error('Error executing component JavaScript:', error);
      }
    }
  }

  renderToyotaSUVShowcase(wrapper, dimensions = { width: 300, height: 600 }) {
    // Set up the rich interactive Toyota SUV showcase
    const template = this.getToyotaSUVTemplate(dimensions);
    
    // Render the HTML
    wrapper.innerHTML = template.html;
    
    // Create isolated component context
    const componentContext = {
      currentStep: 'step-model-selection',
      selectedSUV: null,
      selectedDealer: null,
      dimensions: dimensions,
      suvData: {
        rav4: {
          name: 'RAV4',
          image: 'RAV4 Hero Image',
          price: '$29,200',
          safety: '5-Star',
          seating: '5 Seats',
          cargo: '37.5 ft³',
          mpg: '28 City',
          towing: '1,500 lbs',
          awd: 'Available',
          features: [
            'Toyota Safety Sense 2.0',
            '8-inch Touchscreen Display',
            'Apple CarPlay & Android Auto',
            'All-Wheel Drive Available'
          ]
        },
        highlander: {
          name: 'Highlander',
          image: 'Highlander Hero Image',
          price: '$36,420',
          safety: '5-Star',
          seating: '8 Seats',
          cargo: '84.3 ft³',
          mpg: '24 City',
          towing: '5,000 lbs',
          awd: 'Standard',
          features: [
            'Toyota Safety Sense 2.0',
            '12.3-inch Touchscreen',
            'Panoramic Moonroof',
            'Third-Row Seating'
          ]
        },
        '4runner': {
          name: '4Runner',
          image: '4Runner Hero Image',
          price: '$40,040',
          safety: '4-Star',
          seating: '5-7 Seats',
          cargo: '47.2 ft³',
          mpg: '17 City',
          towing: '5,000 lbs',
          awd: 'Standard 4WD',
          features: [
            'Multi-Terrain Select',
            'Crawl Control (CRAWL)',
            'Kinetic Dynamic Suspension',
            'Skid Plates Protection'
          ]
        },
        sequoia: {
          name: 'Sequoia',
          image: 'Sequoia Hero Image',
          price: '$58,300',
          safety: '5-Star',
          seating: '8 Seats',
          cargo: '120.1 ft³',
          mpg: '19 City',
          towing: '9,000 lbs',
          awd: 'Available',
          features: [
            'i-FORCE MAX Hybrid Powertrain',
            '14-inch Touchscreen',
            'Tow Tech Package',
            'Premium JBL Audio'
          ]
        }
      },
      dealerData: {
        'toyota-sf': {
          name: 'Toyota of San Francisco',
          address: '3800 Geary Blvd, San Francisco, CA 94118'
        },
        'toyota-daly': {
          name: 'Toyota of Daly City',
          address: '1700 Hickey Blvd, Daly City, CA 94014'
        },
        'toyota-serramonte': {
          name: 'Serramonte Toyota',
          address: '100 Serramonte Center, Daly City, CA 94015'
        }
      }
    };
    
    // Initialize the interactive functionality
    this.initializeToyotaInteractivity(wrapper, componentContext);
  }

  getToyotaSUVTemplate(dimensions = { width: 300, height: 600 }) {
    // Calculate responsive dimensions for different screen sizes
    const isCompact = dimensions.width < 300 || dimensions.height < 400;
    const isWide = dimensions.width > 600;
    const isTall = dimensions.height > 800;
    
    return {
      html: `
        <div class="fh-ad-unit-container fh-auto-tier1-interactive-experience" id="fh-toyota-suv-showcase" style="
          all: initial;
          box-sizing: border-box !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          position: relative !important;
          width: ${dimensions.width}px !important;
          height: ${dimensions.height}px !important;
          min-width: ${dimensions.width}px !important;
          min-height: ${dimensions.height}px !important;
          max-width: ${dimensions.width}px !important;
          max-height: ${dimensions.height}px !important;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
          color: white !important;
          margin: 0 !important;
          padding: 0 !important;
          cursor: default !important;
          display: block !important;
          float: none !important;
          clear: both !important;
          contain: layout style paint size !important;
          isolation: isolate !important;
        ">
          <!-- Step 1: SUV Model Selection -->
          <div id="step-model-selection" class="fh-step active" style="
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 1 !important;
            transform: translateX(0) !important;
            transition: all 0.4s ease !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 10 !important;
          ">
            <!-- Header -->
            <div class="fh-header" style="
              background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
              padding: ${Math.max(12, dimensions.height * 0.027)}px;
              text-align: center;
              position: relative;
            ">
              <h2 style="
                margin: 0 0 4px 0;
                font-size: ${Math.max(14, Math.min(24, dimensions.width * 0.06))}px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">Toyota SUVs</h2>
              <p style="
                margin: 0;
                font-size: ${Math.max(10, Math.min(16, dimensions.width * 0.04))}px;
                opacity: 0.9;
                font-weight: 400;
              ">Find Your Perfect Adventure Partner</p>
            </div>

            <!-- SUV Grid -->
            <div class="fh-suv-grid" style="
              flex: 1;
              padding: 20px 16px;
              overflow-y: auto;
            ">
              <!-- RAV4 -->
              <div class="fh-suv-card" data-suv="rav4" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; align-items: center;">
                  <div class="fh-suv-image" style="
                    width: 60px !important;
                    height: 45px !important;
                    background: rgba(255,107,53,0.3) !important;
                    border: 1px solid rgba(255,107,53,0.5) !important;
                    border-radius: 6px !important;
                    margin-right: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 9px !important;
                    text-align: center !important;
                    line-height: 1.1 !important;
                    color: white !important;
                    font-weight: 500 !important;
                  ">
                    RAV4<br>Image
                  </div>
                  <div style="flex: 1;">
                    <h3 style="
                      margin: 0 0 4px 0;
                      font-size: 16px;
                      font-weight: 600;
                    ">RAV4</h3>
                    <p style="
                      margin: 0;
                      font-size: 11px;
                      color: #ccc;
                      line-height: 1.3;
                    ">Compact • Starting at $29,200</p>
                  </div>
                  <div class="fh-arrow" style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>

              <!-- Highlander -->
              <div class="fh-suv-card" data-suv="highlander" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; align-items: center;">
                  <div class="fh-suv-image" style="
                    width: 60px !important;
                    height: 45px !important;
                    background: rgba(255,107,53,0.3) !important;
                    border: 1px solid rgba(255,107,53,0.5) !important;
                    border-radius: 6px !important;
                    margin-right: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 9px !important;
                    text-align: center !important;
                    line-height: 1.1 !important;
                    color: white !important;
                    font-weight: 500 !important;
                  ">
                    Highlander<br>Image
                  </div>
                  <div style="flex: 1;">
                    <h3 style="
                      margin: 0 0 4px 0;
                      font-size: 16px;
                      font-weight: 600;
                    ">Highlander</h3>
                    <p style="
                      margin: 0;
                      font-size: 11px;
                      color: #ccc;
                      line-height: 1.3;
                    ">Midsize • Starting at $36,420</p>
                  </div>
                  <div class="fh-arrow" style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>

              <!-- 4Runner -->
              <div class="fh-suv-card" data-suv="4runner" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; align-items: center;">
                  <div class="fh-suv-image" style="
                    width: 60px !important;
                    height: 45px !important;
                    background: rgba(255,107,53,0.3) !important;
                    border: 1px solid rgba(255,107,53,0.5) !important;
                    border-radius: 6px !important;
                    margin-right: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 9px !important;
                    text-align: center !important;
                    line-height: 1.1 !important;
                    color: white !important;
                    font-weight: 500 !important;
                  ">
                    4Runner<br>Image
                  </div>
                  <div style="flex: 1;">
                    <h3 style="
                      margin: 0 0 4px 0;
                      font-size: 16px;
                      font-weight: 600;
                    ">4Runner</h3>
                    <p style="
                      margin: 0;
                      font-size: 11px;
                      color: #ccc;
                      line-height: 1.3;
                    ">Off-Road • Starting at $40,040</p>
                  </div>
                  <div class="fh-arrow" style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>

              <!-- Sequoia -->
              <div class="fh-suv-card" data-suv="sequoia" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; align-items: center;">
                  <div class="fh-suv-image" style="
                    width: 60px !important;
                    height: 45px !important;
                    background: rgba(255,107,53,0.3) !important;
                    border: 1px solid rgba(255,107,53,0.5) !important;
                    border-radius: 6px !important;
                    margin-right: 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 9px !important;
                    text-align: center !important;
                    line-height: 1.1 !important;
                    color: white !important;
                    font-weight: 500 !important;
                  ">
                    Sequoia<br>Image
                  </div>
                  <div style="flex: 1;">
                    <h3 style="
                      margin: 0 0 4px 0;
                      font-size: 16px;
                      font-weight: 600;
                    ">Sequoia</h3>
                    <p style="
                      margin: 0;
                      font-size: 11px;
                      color: #ccc;
                      line-height: 1.3;
                    ">Full-Size • Starting at $58,300</p>
                  </div>
                  <div class="fh-arrow" style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: SUV Details & Specifications -->
          <div id="step-suv-details" class="fh-step" style="
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important;
            transform: translateX(100%) !important;
            transition: all 0.4s ease !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 5 !important;
          ">
            <!-- Header with Back Button -->
            <div class="fh-header" style="
              background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
              padding: 12px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <button class="back-to-selection" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">‹ Back</button>
              <div style="text-align: center; flex: 1;">
                <h2 id="selected-suv-name" style="
                  margin: 0;
                  font-size: 16px;
                  font-weight: 700;
                ">RAV4</h2>
              </div>
              <div style="width: 50px;"></div>
            </div>

            <!-- SUV Hero Image -->
            <div class="fh-suv-hero" style="
              height: 140px;
              background: linear-gradient(135deg, #333 0%, #555 100%);
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div id="selected-suv-image" style="
                width: 200px;
                height: 120px;
                background: rgba(255,107,53,0.2);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                text-align: center;
              ">
                RAV4 Hero Image
              </div>
            </div>

            <!-- Specifications -->
            <div class="fh-specs-container" style="
              flex: 1;
              padding: 16px;
              overflow-y: auto;
            ">
              <div class="fh-spec-grid" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 16px;
              ">
                <div class="fh-spec-card" style="
                  background: rgba(255,255,255,0.08);
                  padding: 10px;
                  border-radius: 6px;
                  text-align: center;
                  backdrop-filter: blur(10px);
                ">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 2px;">SAFETY</div>
                  <div id="safety-rating" style="font-size: 14px; font-weight: 600; color: #ff6b35;">5-Star</div>
                </div>
                <div class="fh-spec-card" style="
                  background: rgba(255,255,255,0.08);
                  padding: 10px;
                  border-radius: 6px;
                  text-align: center;
                  backdrop-filter: blur(10px);
                ">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 2px;">SEATING</div>
                  <div id="seating-capacity" style="font-size: 14px; font-weight: 600; color: #ff6b35;">5 Seats</div>
                </div>
                <div class="fh-spec-card" style="
                  background: rgba(255,255,255,0.08);
                  padding: 10px;
                  border-radius: 6px;
                  text-align: center;
                  backdrop-filter: blur(10px);
                ">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 2px;">CARGO</div>
                  <div id="cargo-space" style="font-size: 14px; font-weight: 600; color: #ff6b35;">37.5 ft³</div>
                </div>
                <div class="fh-spec-card" style="
                  background: rgba(255,255,255,0.08);
                  padding: 10px;
                  border-radius: 6px;
                  text-align: center;
                  backdrop-filter: blur(10px);
                ">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 2px;">MPG</div>
                  <div id="fuel-economy" style="font-size: 14px; font-weight: 600; color: #ff6b35;">28 City</div>
                </div>
                <div class="fh-spec-card" style="
                  background: rgba(255,255,255,0.08);
                  padding: 10px;
                  border-radius: 6px;
                  text-align: center;
                  backdrop-filter: blur(10px);
                ">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 2px;">TOWING</div>
                  <div id="towing-capacity" style="font-size: 14px; font-weight: 600; color: #ff6b35;">1,500 lbs</div>
                </div>
                <div class="fh-spec-card" style="
                  background: rgba(255,255,255,0.08);
                  padding: 10px;
                  border-radius: 6px;
                  text-align: center;
                  backdrop-filter: blur(10px);
                ">
                  <div style="font-size: 11px; color: #aaa; margin-bottom: 2px;">AWD</div>
                  <div id="awd-available" style="font-size: 14px; font-weight: 600; color: #ff6b35;">Available</div>
                </div>
              </div>

              <!-- Key Features -->
              <div class="fh-features" style="
                background: rgba(255,255,255,0.08);
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 16px;
                backdrop-filter: blur(10px);
              ">
                <h4 style="
                  margin: 0 0 8px 0;
                  font-size: 13px;
                  font-weight: 600;
                  color: #ff6b35;
                ">Key Features</h4>
                <ul id="key-features" style="
                  margin: 0;
                  padding-left: 16px;
                  font-size: 11px;
                  line-height: 1.4;
                  color: #ddd;
                ">
                  <li>Toyota Safety Sense 2.0</li>
                  <li>8-inch Touchscreen Display</li>
                  <li>Apple CarPlay & Android Auto</li>
                  <li>All-Wheel Drive Available</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <button class="find-dealers-btn" style="
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">
                Find Local Dealers
              </button>
            </div>
          </div>

          <!-- Step 3: Dealer Selection -->
          <div id="step-dealer-selection" class="fh-step" style="
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important;
            transform: translateX(100%) !important;
            transition: all 0.4s ease !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 5 !important;
          ">
            <!-- Header -->
            <div class="fh-header" style="
              background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
              padding: 12px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <button class="back-to-details" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">‹ Back</button>
              <div style="text-align: center; flex: 1;">
                <h2 style="
                  margin: 0;
                  font-size: 16px;
                  font-weight: 700;
                ">Local Dealers</h2>
              </div>
              <div style="width: 50px;"></div>
            </div>

            <!-- Location Header -->
            <div style="
              padding: 12px 16px;
              background: rgba(255,255,255,0.05);
              border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
              <div style="
                font-size: 12px;
                color: #aaa;
                margin-bottom: 4px;
              ">📍 Near Your Location</div>
              <div style="
                font-size: 14px;
                font-weight: 500;
              ">San Francisco Bay Area</div>
            </div>

            <!-- Dealer List -->
            <div class="fh-dealer-list" style="
              flex: 1;
              padding: 16px;
              overflow-y: auto;
            ">
              <!-- Dealer 1 -->
              <div class="fh-dealer-card" data-dealer="toyota-sf" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 14px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <h4 style="
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1.2;
                  ">Toyota of San Francisco</h4>
                  <div style="
                    background: #4CAF50;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 500;
                  ">OPEN</div>
                </div>
                <div style="
                  font-size: 12px;
                  color: #ccc;
                  margin-bottom: 6px;
                  line-height: 1.3;
                ">3800 Geary Blvd, San Francisco, CA 94118</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="
                    font-size: 11px;
                    color: #ff6b35;
                  ">📞 (415) 751-1500 • 2.3 miles</div>
                  <div style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>

              <!-- Dealer 2 -->
              <div class="fh-dealer-card" data-dealer="toyota-daly" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 14px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <h4 style="
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1.2;
                  ">Toyota of Daly City</h4>
                  <div style="
                    background: #4CAF50;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 500;
                  ">OPEN</div>
                </div>
                <div style="
                  font-size: 12px;
                  color: #ccc;
                  margin-bottom: 6px;
                  line-height: 1.3;
                ">1700 Hickey Blvd, Daly City, CA 94014</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="
                    font-size: 11px;
                    color: #ff6b35;
                  ">📞 (650) 991-8600 • 4.7 miles</div>
                  <div style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>

              <!-- Dealer 3 -->
              <div class="fh-dealer-card" data-dealer="toyota-serramonte" style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 14px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <h4 style="
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1.2;
                  ">Serramonte Toyota</h4>
                  <div style="
                    background: #FF9800;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 500;
                  ">CLOSES 9PM</div>
                </div>
                <div style="
                  font-size: 12px;
                  color: #ccc;
                  margin-bottom: 6px;
                  line-height: 1.3;
                ">100 Serramonte Center, Daly City, CA 94015</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="
                    font-size: 11px;
                    color: #ff6b35;
                  ">📞 (650) 992-8200 • 5.1 miles</div>
                  <div style="
                    color: #ff6b35;
                    font-size: 16px;
                    font-weight: bold;
                  ">›</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Test Drive Scheduling -->
          <div id="step-test-drive" class="fh-step" style="
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important;
            transform: translateX(100%) !important;
            transition: all 0.4s ease !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 5 !important;
          ">
            <!-- Header -->
            <div class="fh-header" style="
              background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
              padding: 12px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <button class="back-to-dealers" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
              ">‹ Back</button>
              <div style="text-align: center; flex: 1;">
                <h2 style="
                  margin: 0;
                  font-size: 16px;
                  font-weight: 700;
                ">Schedule Test Drive</h2>
              </div>
              <div style="width: 50px;"></div>
            </div>

            <!-- Selected Info Summary -->
            <div style="
              padding: 14px 16px;
              background: rgba(255,255,255,0.05);
              border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
              <div style="
                font-size: 12px;
                color: #aaa;
                margin-bottom: 4px;
              ">Your Selection</div>
              <div style="
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 2px;
              " id="summary-suv">Toyota RAV4</div>
              <div style="
                font-size: 12px;
                color: #ff6b35;
              " id="summary-dealer">Toyota of San Francisco</div>
            </div>

            <!-- Scheduling Form -->
            <div class="fh-scheduling-form" style="
              flex: 1;
              padding: 20px 16px;
              overflow-y: auto;
            ">
              <!-- Date Selection -->
              <div style="margin-bottom: 20px;">
                <label style="
                  display: block;
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #ff6b35;
                ">Preferred Date</label>
                <select id="test-drive-date" style="
                  width: 100%;
                  padding: 12px;
                  background: rgba(255,255,255,0.08);
                  border: 2px solid rgba(255,255,255,0.1);
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  backdrop-filter: blur(10px);
                  box-sizing: border-box;
                ">
                  <option value="">Select a date</option>
                  <option value="today">Today - Dec 15, 2024</option>
                  <option value="tomorrow">Tomorrow - Dec 16, 2024</option>
                  <option value="dec17">Tuesday - Dec 17, 2024</option>
                  <option value="dec18">Wednesday - Dec 18, 2024</option>
                  <option value="dec19">Thursday - Dec 19, 2024</option>
                  <option value="dec20">Friday - Dec 20, 2024</option>
                  <option value="dec21">Saturday - Dec 21, 2024</option>
                </select>
              </div>

              <!-- Contact Information -->
              <div style="margin-bottom: 20px;">
                <label style="
                  display: block;
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #ff6b35;
                ">Contact Information</label>
                <input type="text" id="customer-name" placeholder="Full Name" style="
                  width: 100%;
                  padding: 12px;
                  background: rgba(255,255,255,0.08);
                  border: 2px solid rgba(255,255,255,0.1);
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  margin-bottom: 8px;
                  backdrop-filter: blur(10px);
                  box-sizing: border-box;
                ">
                <input type="tel" id="customer-phone" placeholder="Phone Number" style="
                  width: 100%;
                  padding: 12px;
                  background: rgba(255,255,255,0.08);
                  border: 2px solid rgba(255,255,255,0.1);
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  margin-bottom: 8px;
                  backdrop-filter: blur(10px);
                  box-sizing: border-box;
                ">
                <input type="email" id="customer-email" placeholder="Email Address" style="
                  width: 100%;
                  padding: 12px;
                  background: rgba(255,255,255,0.08);
                  border: 2px solid rgba(255,255,255,0.1);
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  backdrop-filter: blur(10px);
                  box-sizing: border-box;
                ">
              </div>

              <!-- Special Requests -->
              <div style="margin-bottom: 24px;">
                <label style="
                  display: block;
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  color: #ff6b35;
                ">Special Requests (Optional)</label>
                <textarea id="special-requests" placeholder="Any specific features you'd like to focus on during the test drive?" style="
                  width: 100%;
                  height: 60px;
                  padding: 12px;
                  background: rgba(255,255,255,0.08);
                  border: 2px solid rgba(255,255,255,0.1);
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  resize: none;
                  backdrop-filter: blur(10px);
                  box-sizing: border-box;
                "></textarea>
              </div>

              <!-- Schedule Button -->
              <button class="schedule-btn" style="
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">
                Schedule My Test Drive
              </button>
            </div>
          </div>

          <!-- Step 5: Confirmation -->
          <div id="step-confirmation" class="fh-step" style="
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important;
            transform: translateX(100%) !important;
            transition: all 0.4s ease !important;
            display: flex !important;
            flex-direction: column !important;
            text-align: center !important;
            z-index: 5 !important;
          ">
            <!-- Header -->
            <div class="fh-header" style="
              background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
              padding: 16px;
              text-align: center;
            ">
              <div style="
                font-size: 24px;
                margin-bottom: 4px;
              ">✓</div>
              <h2 style="
                margin: 0;
                font-size: 18px;
                font-weight: 700;
              ">Test Drive Scheduled!</h2>
            </div>

            <!-- Confirmation Details -->
            <div style="
              flex: 1;
              padding: 24px 16px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            ">
              <!-- Success Icon -->
              <div style="
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
              ">✓</div>

              <!-- Confirmation Message -->
              <h3 style="
                margin: 0 0 16px 0;
                font-size: 20px;
                font-weight: 600;
                color: #4CAF50;
              ">You're All Set!</h3>
              
              <p style="
                margin: 0 0 24px 0;
                font-size: 14px;
                line-height: 1.5;
                color: #ccc;
              ">Your test drive has been scheduled. You'll receive a confirmation email shortly with all the details.</p>

              <!-- Appointment Summary -->
              <div style="
                background: rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
                backdrop-filter: blur(10px);
                text-align: left;
              ">
                <h4 style="
                  margin: 0 0 12px 0;
                  font-size: 14px;
                  font-weight: 600;
                  color: #ff6b35;
                ">Appointment Details</h4>
                <div style="margin-bottom: 8px;">
                  <span style="color: #aaa; font-size: 12px;">Vehicle:</span>
                  <span style="font-size: 13px; font-weight: 500; margin-left: 8px;" id="confirm-suv">Toyota RAV4</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #aaa; font-size: 12px;">Dealer:</span>
                  <span style="font-size: 13px; font-weight: 500; margin-left: 8px;" id="confirm-dealer">Toyota of San Francisco</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="color: #aaa; font-size: 12px;">Date:</span>
                  <span style="font-size: 13px; font-weight: 500; margin-left: 8px;" id="confirm-date">Tomorrow - Dec 16, 2024</span>
                </div>
                <div>
                  <span style="color: #aaa; font-size: 12px;">Time:</span>
                  <span style="font-size: 13px; font-weight: 500; margin-left: 8px;" id="confirm-time">10:00 AM</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 8px;">
                <button class="browse-more-btn" style="
                  flex: 1;
                  padding: 12px;
                  background: rgba(255,255,255,0.1);
                  color: white;
                  border: 2px solid rgba(255,255,255,0.2);
                  border-radius: 6px;
                  font-weight: 500;
                  font-size: 13px;
                  cursor: pointer;
                  transition: all 0.2s ease;
                ">
                  Browse More SUVs
                </button>
                <button class="visit-toyota-btn" style="
                  flex: 1;
                  padding: 12px;
                  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-weight: 500;
                  font-size: 13px;
                  cursor: pointer;
                  transition: transform 0.2s ease;
                ">
                  Visit Toyota.com
                </button>
              </div>
            </div>
          </div>
        </div>
      `
    };
  }

  initializeToyotaInteractivity(wrapper, context) {
    // Add CSS styles
    this.injectToyotaStyles(wrapper);
    
    // Set up event listeners for SUV selection
    const suvCards = wrapper.querySelectorAll('.fh-suv-card');
    suvCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const suvModel = card.getAttribute('data-suv');
        this.selectSUV(wrapper, context, suvModel);
      });
    });
    
    // Set up dealer selection
    const dealerCards = wrapper.querySelectorAll('.fh-dealer-card');
    dealerCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const dealerId = card.getAttribute('data-dealer');
        this.selectDealer(wrapper, context, dealerId);
      });
    });
    
    // Set up back buttons
    const backToSelectionBtn = wrapper.querySelector('.back-to-selection');
    if (backToSelectionBtn) {
      backToSelectionBtn.addEventListener('click', () => {
        this.goToStep(wrapper, context, 'step-model-selection');
      });
    }
    
    const backToDetailsBtn = wrapper.querySelector('.back-to-details');
    if (backToDetailsBtn) {
      backToDetailsBtn.addEventListener('click', () => {
        this.goToStep(wrapper, context, 'step-suv-details');
      });
    }
    
    const backToDealersBtn = wrapper.querySelector('.back-to-dealers');
    if (backToDealersBtn) {
      backToDealersBtn.addEventListener('click', () => {
        this.goToStep(wrapper, context, 'step-dealer-selection');
      });
    }
    
    // Set up find dealers button
    const findDealersBtn = wrapper.querySelector('.find-dealers-btn');
    if (findDealersBtn) {
      findDealersBtn.addEventListener('click', () => {
        this.goToStep(wrapper, context, 'step-dealer-selection');
      });
    }
    
    // Set up schedule button
    const scheduleBtn = wrapper.querySelector('.schedule-btn');
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', () => {
        this.scheduleTestDrive(wrapper, context);
      });
    }
    
    // Set up confirmation buttons
    const browseMoreBtn = wrapper.querySelector('.browse-more-btn');
    if (browseMoreBtn) {
      browseMoreBtn.addEventListener('click', () => {
        this.goToStep(wrapper, context, 'step-model-selection');
      });
    }
    
    const visitToyotaBtn = wrapper.querySelector('.visit-toyota-btn');
    if (visitToyotaBtn) {
      visitToyotaBtn.addEventListener('click', () => {
        window.open('https://www.toyota.com', '_blank');
      });
    }
    
    // Initialize with first step visible
    this.goToStep(wrapper, context, 'step-model-selection');
  }

  selectSUV(wrapper, context, suvModel) {
    context.selectedSUV = suvModel;
    const suv = context.suvData[suvModel];
    
    console.log('SUV selected:', suvModel);
    
    // Update SUV details page
    const nameEl = wrapper.querySelector('#selected-suv-name');
    const imageEl = wrapper.querySelector('#selected-suv-image');
    const safetyEl = wrapper.querySelector('#safety-rating');
    const seatingEl = wrapper.querySelector('#seating-capacity');
    const cargoEl = wrapper.querySelector('#cargo-space');
    const fuelEl = wrapper.querySelector('#fuel-economy');
    const towingEl = wrapper.querySelector('#towing-capacity');
    const awdEl = wrapper.querySelector('#awd-available');
    
    if (nameEl) nameEl.textContent = suv.name;
    if (imageEl) imageEl.textContent = suv.image;
    if (safetyEl) safetyEl.textContent = suv.safety;
    if (seatingEl) seatingEl.textContent = suv.seating;
    if (cargoEl) cargoEl.textContent = suv.cargo;
    if (fuelEl) fuelEl.textContent = suv.mpg;
    if (towingEl) towingEl.textContent = suv.towing;
    if (awdEl) awdEl.textContent = suv.awd;
    
    // Update features list
    const featuresList = wrapper.querySelector('#key-features');
    if (featuresList) {
      featuresList.innerHTML = '';
      suv.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
      });
    }
    
    // Navigate to details
    this.goToStep(wrapper, context, 'step-suv-details');
  }

  selectDealer(wrapper, context, dealerId) {
    context.selectedDealer = dealerId;
    
    console.log('Dealer selected:', dealerId);
    
    // Navigate to test drive scheduling
    this.goToStep(wrapper, context, 'step-test-drive');
    
    // Update summary
    const dealer = context.dealerData[dealerId];
    const suv = context.suvData[context.selectedSUV];
    
    const summarySuvEl = wrapper.querySelector('#summary-suv');
    const summaryDealerEl = wrapper.querySelector('#summary-dealer');
    
    if (summarySuvEl && suv) {
      summarySuvEl.textContent = `Toyota ${suv.name}`;
    }
    if (summaryDealerEl && dealer) {
      summaryDealerEl.textContent = dealer.name;
    }
  }

  scheduleTestDrive(wrapper, context) {
    // Get form values
    const dateEl = wrapper.querySelector('#test-drive-date');
    const nameEl = wrapper.querySelector('#customer-name');
    const phoneEl = wrapper.querySelector('#customer-phone');
    const emailEl = wrapper.querySelector('#customer-email');
    
    const date = dateEl ? dateEl.value : '';
    const name = nameEl ? nameEl.value : '';
    const phone = phoneEl ? phoneEl.value : '';
    const email = emailEl ? emailEl.value : '';
    
    // Basic validation
    if (!date || !name || !phone || !email) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Test drive scheduled');
    
    // Update confirmation details
    const suv = context.suvData[context.selectedSUV];
    const dealer = context.dealerData[context.selectedDealer];
    const dateText = dateEl.querySelector(`option[value="${date}"]`).textContent;
    
    const confirmSuvEl = wrapper.querySelector('#confirm-suv');
    const confirmDealerEl = wrapper.querySelector('#confirm-dealer');
    const confirmDateEl = wrapper.querySelector('#confirm-date');
    const confirmTimeEl = wrapper.querySelector('#confirm-time');
    
    if (confirmSuvEl && suv) {
      confirmSuvEl.textContent = `Toyota ${suv.name}`;
    }
    if (confirmDealerEl && dealer) {
      confirmDealerEl.textContent = dealer.name;
    }
    if (confirmDateEl) {
      confirmDateEl.textContent = dateText;
    }
    if (confirmTimeEl) {
      confirmTimeEl.textContent = '10:00 AM'; // Default time
    }
    
    // Navigate to confirmation
    this.goToStep(wrapper, context, 'step-confirmation');
  }

  goToStep(wrapper, context, stepId) {
    console.log('Navigating from', context.currentStep, 'to', stepId);
    
    // Hide current step
    const currentStepEl = wrapper.querySelector(`#${context.currentStep}`);
    if (currentStepEl) {
      currentStepEl.style.opacity = '0';
      currentStepEl.style.transform = 'translateX(-100%)';
      currentStepEl.style.zIndex = '1';
    }
    
    // Show new step after a brief delay
    setTimeout(() => {
      const newStepEl = wrapper.querySelector(`#${stepId}`);
      if (newStepEl) {
        newStepEl.style.opacity = '1';
        newStepEl.style.transform = 'translateX(0)';
        newStepEl.style.zIndex = '10';
      }
      context.currentStep = stepId;
      console.log('Navigation completed to:', stepId);
    }, 100);
  }

  injectToyotaStyles(wrapper) {
    // Add component-specific styles
    const style = document.createElement('style');
    style.textContent = `
      .fh-ad-unit-container * {
        box-sizing: border-box !important;
      }
      .fh-suv-card:hover, .fh-dealer-card:hover {
        background: rgba(255,255,255,0.12) !important;
        border-color: rgba(255,107,53,0.5) !important;
      }
      .find-dealers-btn:hover, .back-to-selection:hover, .back-to-details:hover, .back-to-dealers:hover, .schedule-btn:hover, .browse-more-btn:hover, .visit-toyota-btn:hover {
        transform: translateY(-1px);
      }
      .fh-step {
        box-sizing: border-box !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      input::placeholder, textarea::placeholder {
        color: rgba(255,255,255,0.5) !important;
      }
      select option {
        background: #333 !important;
        color: white !important;
      }
    `;
    wrapper.appendChild(style);
  }

  renderXboxComponent(wrapper, componentClass, dimensions) {
    // Render Xbox Game Pass Interactive Quiz using direct HTML approach (like Toyota)
    const template = this.getXboxGamePassTemplate(dimensions);
    
    // Set wrapper styles
    wrapper.style.width = `${dimensions.width}px`;
    wrapper.style.height = `${dimensions.height}px`;
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    
    // Render the HTML
    wrapper.innerHTML = template.html;
    
    // Initialize Xbox interactivity
    this.initializeXboxInteractivity(wrapper, {
      dimensions: dimensions,
      firstChoice: null,
      secondChoice: null,
      currentStage: 1
    });
  }

  getXboxGamePassTemplate(dimensions = { width: 600, height: 400 }) {
    return {
      html: `
        <div class="fh-xbox-container" style="
          all: initial;
          box-sizing: border-box !important;
          font-family: Arial, sans-serif !important;
          display: flex !important;
          flex-direction: column !important;
          border-radius: 6px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          background: linear-gradient(to right, #0a2e1f, #1a2735) !important;
          color: white !important;
          border: 1px solid #10b981 !important;
          width: ${dimensions.width}px !important;
          height: ${dimensions.height}px !important;
          position: relative !important;
          margin: 0 !important;
          padding: 0 !important;
          contain: layout style paint size !important;
          isolation: isolate !important;
        ">
          <!-- Header -->
          <div class="fh-xbox-header" style="
            background-color: #000 !important;
            padding: 8px 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            height: 40px !important;
          ">
            <div class="fh-xbox-logo-container" style="
              display: flex !important;
              align-items: center !important;
            ">
              <img src="https://i.ibb.co/5X0GGgD5/xbox-white-1.png" alt="Xbox Logo" style="
                width: 24px !important;
                height: 24px !important;
                margin-right: 6px !important;
              ">
              <span style="
                font-weight: bold !important;
                font-size: 16px !important;
              ">Game Pass</span>
            </div>
            <div style="
              font-size: 10px !important;
              background-color: #10b981 !important;
              padding: 2px 6px !important;
              border-radius: 2px !important;
            ">AD</div>
          </div>
          
          <!-- Stage 1: Initial Question -->
          <div id="fh-xbox-stage-1" class="fh-xbox-stage" style="
            padding: 15px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            height: calc(100% - 40px) !important;
          ">
            <h2 style="
              font-size: 20px !important;
              font-weight: bold !important;
              margin: 0 0 6px 0 !important;
              text-align: center !important;
              line-height: 1.2 !important;
            ">Discover Your Next Adventure</h2>
            <p style="
              text-align: center !important;
              margin: 0 0 12px 0 !important;
              color: #34d399 !important;
              font-size: 14px !important;
            ">What matters most to you in an RPG?</p>
            
            <div style="
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
              width: 100% !important;
            ">
              <button class="fh-xbox-option" data-choice="story" style="
                background-color: #166534 !important;
                color: white !important;
                padding: 10px 12px !important;
                border-radius: 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                border: none !important;
                transition: background-color 0.3s !important;
                font-size: 14px !important;
                width: 100% !important;
                text-align: left !important;
              ">
                <span style="
                  font-weight: 600 !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                ">Compelling Story</span>
                <span style="
                  width: 16px !important;
                  height: 16px !important;
                  flex-shrink: 0 !important;
                  margin-left: 8px !important;
                ">›</span>
              </button>
              
              <button class="fh-xbox-option" data-choice="combat" style="
                background-color: #166534 !important;
                color: white !important;
                padding: 10px 12px !important;
                border-radius: 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                border: none !important;
                transition: background-color 0.3s !important;
                font-size: 14px !important;
                width: 100% !important;
                text-align: left !important;
              ">
                <span style="
                  font-weight: 600 !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                ">Exciting Combat</span>
                <span style="
                  width: 16px !important;
                  height: 16px !important;
                  flex-shrink: 0 !important;
                  margin-left: 8px !important;
                ">›</span>
              </button>
              
              <button class="fh-xbox-option" data-choice="exploration" style="
                background-color: #166534 !important;
                color: white !important;
                padding: 10px 12px !important;
                border-radius: 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                border: none !important;
                transition: background-color 0.3s !important;
                font-size: 14px !important;
                width: 100% !important;
                text-align: left !important;
              ">
                <span style="
                  font-weight: 600 !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                ">World Exploration</span>
                <span style="
                  width: 16px !important;
                  height: 16px !important;
                  flex-shrink: 0 !important;
                  margin-left: 8px !important;
                ">›</span>
              </button>
            </div>
          </div>
          
          <!-- Stage 2: Follow-up Question -->
          <div id="fh-xbox-stage-2" class="fh-xbox-stage" style="
            padding: 15px !important;
            display: none !important;
            flex-direction: column !important;
            align-items: center !important;
            height: calc(100% - 40px) !important;
          ">
            <h2 style="
              font-size: 20px !important;
              font-weight: bold !important;
              margin: 0 0 6px 0 !important;
              text-align: center !important;
              line-height: 1.2 !important;
            ">Almost There!</h2>
            <p style="
              text-align: center !important;
              margin: 0 0 12px 0 !important;
              color: #34d399 !important;
              font-size: 14px !important;
            ">What setting captures your imagination?</p>
            
            <div style="
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
              width: 100% !important;
            ">
              <button class="fh-xbox-option" data-choice="fantasy" style="
                background-color: #166534 !important;
                color: white !important;
                padding: 10px 12px !important;
                border-radius: 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                border: none !important;
                transition: background-color 0.3s !important;
                font-size: 14px !important;
                width: 100% !important;
                text-align: left !important;
              ">
                <span style="
                  font-weight: 600 !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                ">Epic Fantasy</span>
                <span style="
                  width: 16px !important;
                  height: 16px !important;
                  flex-shrink: 0 !important;
                  margin-left: 8px !important;
                ">›</span>
              </button>
              
              <button class="fh-xbox-option" data-choice="scifi" style="
                background-color: #166534 !important;
                color: white !important;
                padding: 10px 12px !important;
                border-radius: 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                border: none !important;
                transition: background-color 0.3s !important;
                font-size: 14px !important;
                width: 100% !important;
                text-align: left !important;
              ">
                <span style="
                  font-weight: 600 !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                ">Sci-Fi Worlds</span>
                <span style="
                  width: 16px !important;
                  height: 16px !important;
                  flex-shrink: 0 !important;
                  margin-left: 8px !important;
                ">›</span>
              </button>
              
              <button class="fh-xbox-option" data-choice="action" style="
                background-color: #166534 !important;
                color: white !important;
                padding: 10px 12px !important;
                border-radius: 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                border: none !important;
                transition: background-color 0.3s !important;
                font-size: 14px !important;
                width: 100% !important;
                text-align: left !important;
              ">
                <span style="
                  font-weight: 600 !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                ">Action Adventure</span>
                <span style="
                  width: 16px !important;
                  height: 16px !important;
                  flex-shrink: 0 !important;
                  margin-left: 8px !important;
                ">›</span>
              </button>
            </div>
          </div>
          
          <!-- Stage 3: Recommendation -->
          <div id="fh-xbox-stage-3" class="fh-xbox-stage" style="
            padding: 15px !important;
            display: none !important;
            flex-direction: column !important;
            align-items: center !important;
            height: calc(100% - 40px) !important;
          ">
            <div style="
              display: flex !important;
              gap: 12px !important;
              width: 100% !important;
              height: 280px !important;
            ">
              <div style="
                flex: 0 0 45% !important;
              ">
                <img id="fh-xbox-game-image" src="https://i.ibb.co/bRNh9NFk/gaming-1.jpg" alt="Game Image" style="
                  width: 100% !important;
                  height: auto !important;
                  max-height: 140px !important;
                  border-radius: 4px !important;
                  object-fit: cover !important;
                ">
              </div>
              
              <div style="
                flex: 0 0 55% !important;
                display: flex !important;
                flex-direction: column !important;
              ">
                <h2 id="fh-xbox-game-title" style="
                  font-size: 18px !important;
                  font-weight: bold !important;
                  margin: 0 0 6px 0 !important;
                  line-height: 1.2 !important;
                ">Game Title</h2>
                <p id="fh-xbox-game-description" style="
                  margin: 0 0 8px 0 !important;
                  font-size: 12px !important;
                  line-height: 1.3 !important;
                  max-height: 80px !important;
                  overflow: hidden !important;
                ">Game description will appear here.</p>
                
                <div style="
                  background-color: #16a34a !important;
                  color: white !important;
                  padding: 2px 6px !important;
                  border-radius: 2px !important;
                  font-size: 11px !important;
                  font-weight: 600 !important;
                  display: inline-block !important;
                  margin: 0 0 8px 0 !important;
                  width: fit-content !important;
                ">Perfect Match!</div>
                
                <button id="fh-xbox-cta-btn" style="
                  background-color: #10b981 !important;
                  color: white !important;
                  font-weight: bold !important;
                  padding: 8px 16px !important;
                  border-radius: 4px !important;
                  text-align: center !important;
                  text-decoration: none !important;
                  transition: background-color 0.3s !important;
                  display: inline-block !important;
                  font-size: 14px !important;
                  width: fit-content !important;
                  border: none !important;
                  cursor: pointer !important;
                ">
                  Play Free for 30 Days
                </button>
                
                <p style="
                  font-size: 9px !important;
                  margin: 8px 0 0 0 !important;
                  color: #34d399 !important;
                ">
                  Xbox Game Pass | New members only | Terms apply
                </p>
              </div>
            </div>
            
            <div style="
              position: absolute !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              padding: 8px 15px !important;
              border-top: 1px solid #166534 !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              background: rgba(10, 46, 31, 0.8) !important;
            ">
              <button id="fh-xbox-start-over" style="
                color: #34d399 !important;
                background: none !important;
                border: none !important;
                font-size: 11px !important;
                cursor: pointer !important;
              ">
                Start Over
              </button>
              
              <p style="
                font-size: 11px !important;
                margin: 0 !important;
              ">
                100+ RPGs available on Game Pass
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  initializeXboxInteractivity(wrapper, context) {
    // Add hover effects
    this.injectXboxStyles(wrapper);
    
    // Set up event listeners for stage 1
    const stage1Options = wrapper.querySelectorAll('#fh-xbox-stage-1 .fh-xbox-option');
    stage1Options.forEach(option => {
      option.addEventListener('click', () => {
        context.firstChoice = option.getAttribute('data-choice');
        this.showXboxStage(wrapper, 2);
      });
    });
    
    // Set up event listeners for stage 2
    const stage2Options = wrapper.querySelectorAll('#fh-xbox-stage-2 .fh-xbox-option');
    stage2Options.forEach(option => {
      option.addEventListener('click', () => {
        context.secondChoice = option.getAttribute('data-choice');
        this.updateXboxRecommendation(wrapper, context);
        this.showXboxStage(wrapper, 3);
      });
    });
    
    // CTA button
    const ctaBtn = wrapper.querySelector('#fh-xbox-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        window.open('https://www.xbox.com/en-US/xbox-game-pass', '_blank');
      });
    }
    
    // Start over button
    const startOverBtn = wrapper.querySelector('#fh-xbox-start-over');
    if (startOverBtn) {
      startOverBtn.addEventListener('click', () => {
        context.firstChoice = null;
        context.secondChoice = null;
        this.showXboxStage(wrapper, 1);
      });
    }
  }

  showXboxStage(wrapper, stageNumber) {
    // Hide all stages
    for (let i = 1; i <= 3; i++) {
      const stage = wrapper.querySelector(`#fh-xbox-stage-${i}`);
      if (stage) {
        stage.style.display = 'none';
      }
    }
    
    // Show the requested stage
    const targetStage = wrapper.querySelector(`#fh-xbox-stage-${stageNumber}`);
    if (targetStage) {
      targetStage.style.display = 'flex';
    }
  }

  updateXboxRecommendation(wrapper, context) {
    const recommendations = {
      'story-fantasy': {
        title: "Dragon Age: The Veilguard",
        description: "Embark on an epic journey through Thedas as Rook, gathering companions to save the world from looming disaster.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'story-scifi': {
        title: "Mass Effect Legendary Edition",
        description: "Lead Commander Shepard in the fight to save the galaxy in this remastered trilogy with over 100 hours of story.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'story-action': {
        title: "Cyberpunk 2077",
        description: "Navigate the dangerous streets of Night City in this story-driven open-world adventure.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'combat-fantasy': {
        title: "Elden Ring",
        description: "Challenge yourself in the Lands Between with punishing but rewarding combat in this dark fantasy epic.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'combat-scifi': {
        title: "Halo Infinite",
        description: "Master tactical combat with a sci-fi arsenal as you battle across exotic planets as the Master Chief.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'combat-action': {
        title: "Diablo IV",
        description: "Unleash your combat skills against the forces of hell in this action-packed dungeon crawler.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'exploration-fantasy': {
        title: "The Elder Scrolls V: Skyrim",
        description: "Explore the vast province of Skyrim with unlimited freedom in this legendary open-world fantasy RPG.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'exploration-scifi': {
        title: "Starfield",
        description: "Chart your own path through the stars in Bethesda's epic space RPG with over 1000 planets to explore.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      },
      'exploration-action': {
        title: "Assassin's Creed: Odyssey",
        description: "Forge your destiny in Ancient Greece in this action-adventure with a massive world to discover.",
        image: "https://i.ibb.co/bRNh9NFk/gaming-1.jpg"
      }
    };

    const key = `${context.firstChoice}-${context.secondChoice}`;
    const recommendation = recommendations[key] || recommendations['story-fantasy'];
    
    const titleEl = wrapper.querySelector('#fh-xbox-game-title');
    const descEl = wrapper.querySelector('#fh-xbox-game-description');
    const imageEl = wrapper.querySelector('#fh-xbox-game-image');
    
    if (titleEl) titleEl.textContent = recommendation.title;
    if (descEl) descEl.textContent = recommendation.description;
    if (imageEl) {
      imageEl.src = recommendation.image;
      imageEl.alt = recommendation.title;
    }
  }

  injectXboxStyles(wrapper) {
    const style = document.createElement('style');
    style.textContent = `
      .fh-xbox-option:hover {
        background-color: #047857 !important;
      }
      #fh-xbox-cta-btn:hover {
        background-color: #059669 !important;
      }
      #fh-xbox-start-over:hover {
        color: #10b981 !important;
      }
    `;
    wrapper.appendChild(style);
  }
}

if (typeof window !== 'undefined') {
  window.shadowDOMInjector = new ShadowDOMInjector();
}