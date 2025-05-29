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
    } else if (componentClass.name === 'LouisVuittonEndlessSummer') {
      // Louis Vuitton Endless Summer interactive luxury travel component
      this.renderLouisVuittonComponent(wrapper, componentClass, dimensions);
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

  renderLouisVuittonComponent(wrapper, componentClass, dimensions) {
    // Style the wrapper to ensure proper containment
    wrapper.style.cssText = `
      display: block !important;
      width: ${dimensions.width}px !important;
      height: ${dimensions.height}px !important;
      max-width: ${dimensions.width}px !important;
      max-height: ${dimensions.height}px !important;
      overflow: hidden !important;
      position: relative !important;
      contain: layout style paint size !important;
      isolation: isolate !important;
    `;

    const context = {
      currentScreen: 'hero',
      selectedDestination: '',
      cart: [],
      products: {
        turkey: [
          {
            id: 'turkey-1',
            name: 'Scallop Stripe Cardigan',
            description: 'This chic button-up cardigan is crafted in a casual cropped, fitted shape from a flexible wool-blend knit in a graphic scalloped striped finish peppered with Monogram Flower motifs.',
            image: 'https://i.ibb.co/Z6n9byrZ/Chat-GPT-Image-May-29-2025-09-11-15-AM.png',
            price: ''
          },
          {
            id: 'turkey-2',
            name: 'Neverfull MM',
            description: 'Ideal for city commutes and beyond, the iconic Neverfull MM tote is updated for the season in timeless Monogram denim.',
            image: 'https://i.ibb.co/j94tbr6x/Chat-GPT-Image-May-29-2025-09-11-20-AM.png',
            price: ''
          }
        ],
        france: [
          {
            id: 'france-1',
            name: 'Silk Sleeveless Top with Monogram Tie',
            description: 'Sophisticated and Parisian-chic.',
            image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-scallop-stripe-cardigan%20--FTKC23VRF631_PM1_Worn%20view.png?wid=2400&hei=2400',
            price: '$2,230'
          },
          {
            id: 'france-2',
            name: 'LV Isola Flat Sandals',
            description: 'Comfortable and elegant for cobblestone streets and boardwalks.',
            image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-neverfull-mm--M13192_PM2_Front%20view.png?wid=2400&hei=2400',
            price: '$850'
          }
        ],
        portugal: [
          {
            id: 'portugal-1',
            name: 'LV x TM Twist PM',
            description: 'Reimagined with playful touches from the celebratory re-edition of the Louis Vuitton x Murakami collection, the Twist PM handbag makes a chic, summery statement.',
            image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-lv-x-tm-twist-pm--M13239_PM2_Front%20view.png?wid=2400&hei=2400',
            price: ''
          },
          {
            id: 'portugal-2',
            name: 'Swing Open Back Ballerina',
            description: 'The Swing open-back ballerina is a chic, summery style crafted from woven raffia.',
            image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-swing-open-back-ballerina--ATP001RA95_PM2_Front%20view.png?wid=2400&hei=2400',
            price: ''
          }
        ],
        italy: [
          {
            id: 'italy-1',
            name: 'Scarf Print Shirt Dress',
            description: 'This breezy shirt dress is cut in an ample oversized fit with batwing sleeves to enhance the voluminous silhouette.',
            image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-scarf-print-shirt-dress--FTDR42VIO570_PM2_Front%20view.png?wid=2400&hei=2400',
            price: ''
          },
          {
            id: 'italy-2',
            name: 'LV Mare Wedge Sandal',
            description: 'The LV Mare wedge sandal is crafted from raffia, which gives it a refined, artisanal feel.',
            image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-lv-mare-wedge-sandal--ATG008RA95_PM2_Front%20view.png?wid=2400&hei=2400',
            price: ''
          }
        ]
      },
      destinationNames: {
        turkey: 'Oludeniz Beach, Turkey',
        france: 'Bay of Biscay, Biarritz, France',
        portugal: 'Praia da Marinha, Algarve, Portugal',
        italy: 'San Fruttuoso, Liguria, Italy'
      }
    };

    const template = this.getLouisVuittonTemplate(dimensions);
    wrapper.innerHTML = template;
    this.addLouisVuittonStyles(wrapper);
    this.initializeLouisVuittonInteractivity(wrapper, context);
  }

  getLouisVuittonTemplate(dimensions) {
    return `
      <div class="fh-lv-container fh-ad-unit-container" id="fh-louis-vuitton-endless-summer" style="
        all: initial;
        box-sizing: border-box !important;
        font-family: 'Playfair Display', Georgia, serif !important;
        position: relative !important;
        width: ${dimensions.width}px !important;
        height: ${dimensions.height}px !important;
        min-width: ${dimensions.width}px !important;
        min-height: ${dimensions.height}px !important;
        max-width: ${dimensions.width}px !important;
        max-height: ${dimensions.height}px !important;
        background: linear-gradient(135deg, #FAF8F5 0%, #F5F1EB 100%) !important;
        border: 1px solid #E8E0D5 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        color: #2B2B2B !important;
        margin: 0 !important;
        padding: 0 !important;
        cursor: default !important;
        display: block !important;
        float: none !important;
        clear: both !important;
        contain: layout style paint size !important;
        isolation: isolate !important;
      ">
        <!-- Background texture overlay -->
        <div class="fh-lv-texture" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(215, 197, 173, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 70% 80%, rgba(215, 197, 173, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 45% 60%, rgba(215, 197, 173, 0.06) 1px, transparent 1px) !important;
          background-size: 50px 50px, 80px 80px, 60px 60px !important;
          pointer-events: none !important;
        "></div>

        <!-- Header branding -->
        <div class="fh-lv-header" style="
          position: absolute !important;
          top: 20px !important;
          left: 20px !important;
          z-index: 10 !important;
        ">
          <div class="fh-lv-logo" style="
            font-size: 18px !important;
            font-weight: 700 !important;
            color: #2B2B2B !important;
            letter-spacing: 2px !important;
            margin-bottom: 2px !important;
          ">LOUIS VUITTON</div>
          <div class="fh-lv-campaign" style="
            font-size: 12px !important;
            color: #8B7355 !important;
            font-weight: 400 !important;
            letter-spacing: 1px !important;
            font-style: italic !important;
          ">Summer Odyssey</div>
        </div>

        <!-- Cart icon -->
        <div class="fh-lv-cart-icon" style="
          position: absolute !important;
          top: 20px !important;
          right: 20px !important;
          width: 32px !important;
          height: 32px !important;
          background: rgba(215, 197, 173, 0.2) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          opacity: 0 !important;
          z-index: 10 !important;
        ">
          🛍️
          <div class="fh-lv-cart-count" style="
            position: absolute !important;
            top: -5px !important;
            right: -5px !important;
            background: #2B2B2B !important;
            color: white !important;
            font-size: 10px !important;
            width: 16px !important;
            height: 16px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          ">0</div>
        </div>

        <!-- Hero Screen -->
        <div class="fh-lv-screen fh-lv-hero-screen" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          opacity: 1 !important;
          transform: translateX(0) !important;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        ">
          <h1 class="fh-lv-hero-title" style="
            font-size: 32px !important;
            font-weight: 600 !important;
            color: #2B2B2B !important;
            margin-bottom: 16px !important;
            line-height: 1.2 !important;
          ">Where Will Summer Take You?</h1>
          <p class="fh-lv-hero-subtitle" style="
            font-size: 16px !important;
            color: #8B7355 !important;
            margin-bottom: 32px !important;
            max-width: 400px !important;
            line-height: 1.4 !important;
          ">Style your wardrobe for Europe's most luxurious coasts.</p>
          <button class="fh-lv-button fh-lv-destinations-btn" style="
            background: #D7C5AD !important;
            color: #2B2B2B !important;
            border: none !important;
            padding: 14px 28px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            letter-spacing: 1px !important;
            border-radius: 25px !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            font-family: inherit !important;
            text-transform: uppercase !important;
          ">Choose Your Destination</button>
        </div>

        <!-- Destination Screen -->
        <div class="fh-lv-screen fh-lv-destination-screen" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        ">
          <div class="fh-lv-content" style="margin-top: 60px !important;">
            <h2 class="fh-lv-destination-title" style="
              font-size: 24px !important;
              color: #2B2B2B !important;
              margin-bottom: 24px !important;
              text-align: center !important;
            ">Select your destination to explore a curated summer look:</h2>
            <div class="fh-lv-destinations-grid" style="
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 12px !important;
              margin-top: 20px !important;
            ">
              <div class="fh-lv-destination-button" data-destination="turkey" style="
                background: rgba(255, 255, 255, 0.8) !important;
                border: 2px solid #E8E0D5 !important;
                padding: 16px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                text-align: center !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #2B2B2B !important;
                backdrop-filter: blur(10px) !important;
              ">
                Oludeniz Beach<br>Turkey
              </div>
              <div class="fh-lv-destination-button" data-destination="france" style="
                background: rgba(255, 255, 255, 0.8) !important;
                border: 2px solid #E8E0D5 !important;
                padding: 16px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                text-align: center !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #2B2B2B !important;
                backdrop-filter: blur(10px) !important;
              ">
                Bay of Biscay<br>Biarritz, France
              </div>
              <div class="fh-lv-destination-button" data-destination="portugal" style="
                background: rgba(255, 255, 255, 0.8) !important;
                border: 2px solid #E8E0D5 !important;
                padding: 16px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                text-align: center !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #2B2B2B !important;
                backdrop-filter: blur(10px) !important;
              ">
                Praia da Marinha<br>Algarve, Portugal
              </div>
              <div class="fh-lv-destination-button" data-destination="italy" style="
                background: rgba(255, 255, 255, 0.8) !important;
                border: 2px solid #E8E0D5 !important;
                padding: 16px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                text-align: center !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                color: #2B2B2B !important;
                backdrop-filter: blur(10px) !important;
              ">
                San Fruttuoso<br>Liguria, Italy
              </div>
            </div>
          </div>
        </div>

        <!-- Product Screen -->
        <div class="fh-lv-screen fh-lv-product-screen" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          overflow: hidden !important;
        ">
          <!-- Header Section -->
          <div class="fh-lv-product-header" style="
            flex-shrink: 0 !important;
            margin-top: 30px !important;
            margin-bottom: 15px !important;
          ">
            <h2 class="fh-lv-product-title" style="
              font-size: 18px !important;
              color: #2B2B2B !important;
              text-align: center !important;
              margin-bottom: 4px !important;
            ">Indulge in the Elegance of Summer Journeys</h2>
            <p class="fh-lv-product-subtitle" style="
              font-size: 13px !important;
              color: #8B7355 !important;
              text-align: center !important;
              margin-bottom: 0 !important;
            ">Style your wardrobe for your selected destination</p>
          </div>
          
          <!-- Products Section -->
          <div class="fh-lv-products-section" style="
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 0 !important;
          ">
            <div class="fh-lv-products-grid" style="
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 15px !important;
              flex: 1 !important;
              align-content: start !important;
            "></div>
          </div>
          
          <!-- Footer Section -->
          <div class="fh-lv-product-footer" style="
            flex-shrink: 0 !important;
            text-align: center !important;
            margin-top: 15px !important;
          ">
            <button class="fh-lv-button fh-lv-back-button" style="
              background: rgba(139, 115, 85, 0.2) !important;
              color: #8B7355 !important;
              border: 1px solid #8B7355 !important;
              padding: 12px 24px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              letter-spacing: 1px !important;
              border-radius: 25px !important;
              cursor: pointer !important;
              transition: all 0.3s ease !important;
              font-family: inherit !important;
              text-transform: uppercase !important;
            ">← Back to Destinations</button>
          </div>
        </div>

        <!-- Cart Screen -->
        <div class="fh-lv-screen fh-lv-cart-screen" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding: 20px !important;
          display: flex !important;
          flex-direction: column !important;
          opacity: 0 !important;
          transform: translateX(100%) !important;
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        ">
          <div class="fh-lv-content" style="margin-top: 60px !important;">
            <h2 class="fh-lv-cart-title" style="
              font-size: 24px !important;
              color: #2B2B2B !important;
              margin-bottom: 20px !important;
              text-align: center !important;
            ">Your Summer Selection</h2>
            <div class="fh-lv-cart-items" style="
              max-height: 200px !important;
              overflow-y: auto !important;
            "></div>
            <div class="fh-lv-cart-footer" style="
              margin-top: 20px !important;
              padding-top: 16px !important;
              border-top: 1px solid #E8E0D5 !important;
            ">
              <div class="fh-lv-cart-buttons" style="
                display: flex !important;
                gap: 12px !important;
                justify-content: center !important;
              ">
                <button class="fh-lv-button fh-lv-continue-shopping" style="
                  background: rgba(139, 115, 85, 0.2) !important;
                  color: #8B7355 !important;
                  border: 1px solid #8B7355 !important;
                  padding: 14px 28px !important;
                  font-size: 14px !important;
                  font-weight: 600 !important;
                  letter-spacing: 1px !important;
                  border-radius: 25px !important;
                  cursor: pointer !important;
                  transition: all 0.3s ease !important;
                  font-family: inherit !important;
                  text-transform: uppercase !important;
                ">Continue Shopping</button>
                <button class="fh-lv-button fh-lv-shop-site" style="
                  background: #D7C5AD !important;
                  color: #2B2B2B !important;
                  border: none !important;
                  padding: 14px 28px !important;
                  font-size: 14px !important;
                  font-weight: 600 !important;
                  letter-spacing: 1px !important;
                  border-radius: 25px !important;
                  cursor: pointer !important;
                  transition: all 0.3s ease !important;
                  font-family: inherit !important;
                  text-transform: uppercase !important;
                ">Shop on LouisVuitton.com</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeLouisVuittonInteractivity(wrapper, context) {
    const destinationButtons = wrapper.querySelectorAll('.fh-lv-destination-button');
    const cartIcon = wrapper.querySelector('.fh-lv-cart-icon');
    const backButton = wrapper.querySelector('.fh-lv-back-button');
    const continueShoppingButton = wrapper.querySelector('.fh-lv-continue-shopping');
    const shopSiteButton = wrapper.querySelector('.fh-lv-shop-site');
    const destinationsButton = wrapper.querySelector('.fh-lv-destinations-btn');

    // Show destinations screen
    if (destinationsButton) {
      destinationsButton.addEventListener('click', () => {
        this.showLouisVuittonScreen(wrapper, 'destination');
        context.currentScreen = 'destination';
      });
    }

    // Destination selection
    destinationButtons.forEach(button => {
      button.addEventListener('click', () => {
        const destination = button.getAttribute('data-destination');
        this.showLouisVuittonProducts(wrapper, destination, context);
        context.selectedDestination = destination;
        context.currentScreen = 'product';
      });
      
      // Hover effects
      button.addEventListener('mouseenter', () => {
        button.style.borderColor = '#D7C5AD';
        button.style.background = 'rgba(215, 197, 173, 0.1)';
        button.style.transform = 'translateY(-2px)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.borderColor = '#E8E0D5';
        button.style.background = 'rgba(255, 255, 255, 0.8)';
        button.style.transform = 'translateY(0)';
      });
    });

    // Cart functionality
    if (cartIcon) {
      cartIcon.addEventListener('click', () => {
        if (context.cart.length > 0) {
          this.showLouisVuittonCart(wrapper, context);
          context.currentScreen = 'cart';
        }
      });
    }

    // Back button
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.showLouisVuittonScreen(wrapper, 'destination');
        context.currentScreen = 'destination';
      });
    }

    // Continue shopping
    if (continueShoppingButton) {
      continueShoppingButton.addEventListener('click', () => {
        this.showLouisVuittonScreen(wrapper, 'destination');
        context.currentScreen = 'destination';
      });
    }

    // Shop site button
    if (shopSiteButton) {
      shopSiteButton.addEventListener('click', () => {
        window.open('https://louisvuitton.com', '_blank');
      });
    }

    // Initialize cart display
    this.updateLouisVuittonCartDisplay(wrapper, context);
  }

  showLouisVuittonScreen(wrapper, screenType) {
    const screens = wrapper.querySelectorAll('.fh-lv-screen');
    screens.forEach(screen => {
      screen.style.opacity = '0';
      screen.style.transform = 'translateX(100%)';
    });

    const targetScreen = wrapper.querySelector(`.fh-lv-${screenType}-screen`);
    if (targetScreen) {
      setTimeout(() => {
        targetScreen.style.opacity = '1';
        targetScreen.style.transform = 'translateX(0)';
      }, 100);
    }
  }

  showLouisVuittonProducts(wrapper, destination, context) {
    const productsGrid = wrapper.querySelector('.fh-lv-products-grid');
    const subtitle = wrapper.querySelector('.fh-lv-product-subtitle');
    
    if (subtitle) {
      subtitle.textContent = `Style your wardrobe for ${context.destinationNames[destination]}`;
    }
    
    if (productsGrid) {
      productsGrid.innerHTML = '';
      
      const destinationProducts = context.products[destination];
      destinationProducts.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'fh-lv-product-card';
        productCard.style.cssText = `
          background: rgba(255, 255, 255, 0.6) !important;
          border-radius: 8px !important;
          padding: 12px !important;
          text-align: center !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(232, 224, 213, 0.5) !important;
          animation: fadeInUp 0.6s ease forwards !important;
          animation-delay: ${index * 0.1}s !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        `;
        
        productCard.innerHTML = `
          <img class="fh-lv-product-image" 
               src="${product.image}" 
               alt="${product.name}"
               style="
                 width: 100px !important;
                 height: 100px !important;
                 object-fit: cover !important;
                 border-radius: 6px !important;
                 margin-bottom: 8px !important;
                 display: block !important;
                 align-self: center !important;
               "
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="fh-lv-image-placeholder" style="
            display: none !important;
            width: 100px !important;
            height: 100px !important;
            background: linear-gradient(135deg, rgba(215,197,173,0.4), rgba(215,197,173,0.2)) !important;
            border-radius: 6px !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            color: #8B7355 !important;
            font-size: 9px !important;
            text-align: center !important;
            margin-bottom: 8px !important;
            border: 2px dashed rgba(139,115,85,0.3) !important;
            align-self: center !important;
          ">
            <div style="font-weight: 600 !important; margin-bottom: 3px !important;">LOUIS VUITTON</div>
            <div style="line-height: 1.1 !important;">${product.name}</div>
          </div>
          <div class="fh-lv-product-info" style="
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          ">
            <div>
              <div class="fh-lv-product-name" style="
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #2B2B2B !important;
                margin-bottom: 4px !important;
                line-height: 1.2 !important;
              ">${product.name}</div>
              ${product.price ? `<div class="fh-lv-product-price" style="
                font-size: 10px !important;
                color: #8B7355 !important;
                margin-bottom: 8px !important;
              ">${product.price}</div>` : ''}
            </div>
            <button class="fh-lv-add-to-cart" data-product-id="${product.id}" style="
              background: #2B2B2B !important;
              color: white !important;
              border: none !important;
              padding: 6px 12px !important;
              font-size: 10px !important;
              border-radius: 12px !important;
              cursor: pointer !important;
              transition: all 0.3s ease !important;
              font-family: inherit !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              margin-top: auto !important;
            ">Add to Cart</button>
          </div>
        `;
        
        // Add to cart functionality
        const addButton = productCard.querySelector('.fh-lv-add-to-cart');
        addButton.addEventListener('click', () => {
          this.addToLouisVuittonCart(wrapper, product, context);
          addButton.textContent = '✓ Added';
          addButton.style.background = '#4CAF50';
          addButton.disabled = true;
        });

        // Hover effect for add button
        addButton.addEventListener('mouseenter', () => {
          if (!addButton.disabled) {
            addButton.style.background = '#1A1A1A';
          }
        });
        addButton.addEventListener('mouseleave', () => {
          if (!addButton.disabled) {
            addButton.style.background = '#2B2B2B';
          }
        });
        
        productsGrid.appendChild(productCard);
      });
    }
    
    this.showLouisVuittonScreen(wrapper, 'product');
  }

  addToLouisVuittonCart(wrapper, product, context) {
    if (!context.cart.find(item => item.id === product.id)) {
      context.cart.push(product);
      this.updateLouisVuittonCartDisplay(wrapper, context);
    }
  }

  updateLouisVuittonCartDisplay(wrapper, context) {
    const cartIcon = wrapper.querySelector('.fh-lv-cart-icon');
    const cartCount = wrapper.querySelector('.fh-lv-cart-count');
    
    if (cartCount) {
      cartCount.textContent = context.cart.length;
    }
    
    if (cartIcon && context.cart.length > 0) {
      cartIcon.style.opacity = '1';
    } else if (cartIcon) {
      cartIcon.style.opacity = '0';
    }
  }

  showLouisVuittonCart(wrapper, context) {
    const cartItems = wrapper.querySelector('.fh-lv-cart-items');
    
    if (cartItems) {
      cartItems.innerHTML = '';
      
      if (context.cart.length === 0) {
        cartItems.innerHTML = '<div style="text-align: center; color: #8B7355; padding: 40px;">Your cart is empty</div>';
      } else {
        context.cart.forEach(item => {
          const cartItem = document.createElement('div');
          cartItem.className = 'fh-lv-cart-item';
          cartItem.style.cssText = `
            display: flex !important;
            align-items: center !important;
            padding: 12px !important;
            background: rgba(255, 255, 255, 0.6) !important;
            border-radius: 8px !important;
            margin-bottom: 8px !important;
          `;
          
          cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="
              width: 60px !important;
              height: 60px !important;
              object-fit: cover !important;
              border-radius: 4px !important;
              margin-right: 12px !important;
            " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="
              display: none !important;
              width: 60px !important;
              height: 60px !important;
              background: linear-gradient(135deg, rgba(215,197,173,0.4), rgba(215,197,173,0.2)) !important;
              border-radius: 4px !important;
              align-items: center !important;
              justify-content: center !important;
              color: #8B7355 !important;
              font-size: 8px !important;
              text-align: center !important;
              margin-right: 12px !important;
              border: 1px dashed rgba(139,115,85,0.3) !important;
            ">LV</div>
            <div style="flex: 1 !important;">
              <div style="
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #2B2B2B !important;
                margin-bottom: 4px !important;
              ">${item.name}</div>
              <div style="
                font-size: 11px !important;
                color: #8B7355 !important;
              ">${item.price}</div>
            </div>
            <button class="fh-lv-remove-item" data-product-id="${item.id}" style="
              background: none !important;
              border: none !important;
              color: #8B7355 !important;
              cursor: pointer !important;
              font-size: 16px !important;
              padding: 4px !important;
            ">×</button>
          `;
          
          // Remove functionality
          const removeButton = cartItem.querySelector('.fh-lv-remove-item');
          removeButton.addEventListener('click', () => {
            context.cart = context.cart.filter(cartItem => cartItem.id !== item.id);
            this.updateLouisVuittonCartDisplay(wrapper, context);
            this.showLouisVuittonCart(wrapper, context);
          });
          
          cartItems.appendChild(cartItem);
        });
      }
    }
    
    this.showLouisVuittonScreen(wrapper, 'cart');
  }

  addLouisVuittonStyles(wrapper) {
    // Add Google Fonts link
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.textContent = `
      /* Font fallback for faster loading */
      .fh-lv-container, .fh-lv-container * {
        font-family: 'Playfair Display', Georgia, serif !important;
      }
      
      /* CSS Reset for Louis Vuitton component */
      .fh-lv-container * {
        box-sizing: border-box !important;
      }
      
      /* Reset specific elements that need it */
      .fh-lv-container h1, .fh-lv-container h2, .fh-lv-container p, .fh-lv-container div {
        margin: 0 !important;
      }
      
      /* Ensure buttons and interactive elements maintain their padding */
      .fh-lv-container button, .fh-lv-container .fh-lv-screen {
        margin: 0 !important;
      }
      
      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Interactive hover effects */
      .fh-lv-button:hover {
        background: #C9B89A !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(215, 197, 173, 0.4) !important;
      }
      
      .fh-lv-cart-icon:hover {
        background: rgba(215, 197, 173, 0.4) !important;
      }
      
      .fh-lv-back-button:hover {
        background: rgba(139, 115, 85, 0.3) !important;
      }
      
      /* Ensure component isolation */
      #fh-louis-vuitton-endless-summer {
        contain: layout style paint size !important;
        isolation: isolate !important;
        z-index: 1000 !important;
      }
      
      /* Force component dimensions */
      #fh-louis-vuitton-endless-summer,
      .fh-lv-container {
        display: block !important;
        position: relative !important;
        overflow: hidden !important;
      }
    `;
    wrapper.appendChild(style);
  }
}

if (typeof window !== 'undefined') {
  window.shadowDOMInjector = new ShadowDOMInjector();
}