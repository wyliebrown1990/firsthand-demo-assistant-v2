/**
 * Toyota SUV Interactive Showcase
 * Multi-step SUV selection and booking experience
 */

class ToyotaSUVShowcase extends BaseAdUnit {
  constructor() {
    super();
    
    this.state = {
      ...this.state,
      currentStep: 'hero',
      selectedVehicle: null,
      selectedTrim: null,
      selectedColor: null,
      contactForm: {},
      dealerLocation: null,
      showComparison: false
    };
    
    this.data = {
      vehicles: [
        {
          id: 'rav4',
          name: 'RAV4',
          category: 'Compact SUV',
          startingPrice: 27950,
          mpg: '27 city / 35 highway',
          features: ['All-Wheel Drive Available', 'Toyota Safety Sense 2.0', 'Spacious Interior'],
          image: 'rav4-hero.jpg',
          trims: [
            { id: 'le', name: 'LE', price: 27950, description: 'Well-equipped base model' },
            { id: 'xle', name: 'XLE', price: 30250, description: 'Premium comfort features' },
            { id: 'adventure', name: 'Adventure', price: 34600, description: 'Off-road ready' },
            { id: 'limited', name: 'Limited', price: 36300, description: 'Luxury appointments' }
          ],
          colors: [
            { id: 'white', name: 'Blizzard Pearl', hex: '#F7F7F7' },
            { id: 'silver', name: 'Silver Sky Metallic', hex: '#C0C0C0' },
            { id: 'blue', name: 'Blueprint Blue Metallic', hex: '#1E3A8A' },
            { id: 'red', name: 'Ruby Flare Pearl', hex: '#8B0000' }
          ]
        },
        {
          id: 'highlander',
          name: 'Highlander',
          category: '3-Row SUV',
          startingPrice: 35085,
          mpg: '21 city / 29 highway',
          features: ['Seating for 8', 'Standard Toyota Safety Sense 2.0', 'Available Hybrid'],
          image: 'highlander-hero.jpg',
          trims: [
            { id: 'l', name: 'L', price: 35085, description: 'Essential features' },
            { id: 'le', name: 'LE', price: 37405, description: 'Enhanced comfort' },
            { id: 'xle', name: 'XLE', price: 41005, description: 'Premium features' },
            { id: 'limited', name: 'Limited', price: 46005, description: 'Luxury experience' }
          ],
          colors: [
            { id: 'white', name: 'Blizzard Pearl', hex: '#F7F7F7' },
            { id: 'silver', name: 'Silver Sky Metallic', hex: '#C0C0C0' },
            { id: 'black', name: 'Midnight Black Metallic', hex: '#000000' },
            { id: 'green', name: 'Army Green', hex: '#4B5320' }
          ]
        },
        {
          id: '4runner',
          name: '4Runner',
          category: 'Off-Road SUV',
          startingPrice: 37305,
          mpg: '16 city / 19 highway',
          features: ['Legendary Off-Road Capability', 'Body-on-Frame Construction', 'Rugged Durability'],
          image: '4runner-hero.jpg',
          trims: [
            { id: 'sr5', name: 'SR5', price: 37305, description: 'Off-road ready' },
            { id: 'sr5-premium', name: 'SR5 Premium', price: 41305, description: 'Added luxury' },
            { id: 'trd-off-road', name: 'TRD Off-Road', price: 42305, description: 'Enhanced capability' },
            { id: 'limited', name: 'Limited', price: 46305, description: 'Ultimate comfort' }
          ],
          colors: [
            { id: 'white', name: 'Super White', hex: '#FFFFFF' },
            { id: 'silver', name: 'Classic Silver Metallic', hex: '#C0C0C0' },
            { id: 'blue', name: 'Nautical Blue Metallic', hex: '#1B4D72' },
            { id: 'green', name: 'Army Green', hex: '#4B5320' }
          ]
        }
      ],
      dealerInfo: {
        name: 'Adventure Toyota',
        address: '123 Sports Drive, Athletic City, AC 12345',
        phone: '(555) 123-TOYOTA',
        hours: 'Mon-Sat: 9AM-9PM, Sun: 11AM-6PM'
      }
    };
    
    this.steps = ['hero', 'selection', 'customize', 'details', 'complete'];
  }

  getWidth() {
    return '300px';
  }

  getHeight() {
    return '600px';
  }

  getStyles() {
    return `
      .toyota-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%);
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .step-content {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
      
      .toyota-logo {
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        margin-bottom: 16px;
        border-radius: 4px;
      }
      
      .hero-section {
        text-align: center;
        padding: 20px 0;
      }
      
      .hero-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
        line-height: 1.2;
      }
      
      .hero-subtitle {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 20px;
      }
      
      .hero-image {
        width: 100%;
        height: 120px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .vehicle-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .vehicle-card {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid transparent;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .vehicle-card:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .vehicle-card.selected {
        background: rgba(255, 255, 255, 0.2);
        border-color: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .vehicle-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .vehicle-category {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 8px;
      }
      
      .vehicle-price {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
      }
      
      .vehicle-features {
        font-size: 11px;
        opacity: 0.9;
        line-height: 1.3;
      }
      
      .customization-section {
        margin-bottom: 20px;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .trim-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .trim-option {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .trim-option:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .trim-option.selected {
        background: rgba(255, 255, 255, 0.2);
        border-color: white;
      }
      
      .trim-name {
        font-weight: 600;
        margin-bottom: 2px;
      }
      
      .trim-price {
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .trim-description {
        font-size: 11px;
        opacity: 0.9;
      }
      
      .color-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .color-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .color-option:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .color-option.selected {
        background: rgba(255, 255, 255, 0.2);
        border-color: white;
      }
      
      .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.5);
      }
      
      .color-name {
        font-size: 11px;
        flex: 1;
      }
      
      .form-section {
        margin-bottom: 16px;
      }
      
      .form-label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 6px;
        opacity: 0.9;
      }
      
      .form-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 13px;
      }
      
      .form-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .form-input:focus {
        outline: none;
        border-color: white;
        background: rgba(255, 255, 255, 0.15);
      }
      
      .dealer-info {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .dealer-name {
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .dealer-details {
        font-size: 11px;
        opacity: 0.9;
        line-height: 1.4;
      }
      
      .completion-section {
        text-align: center;
        padding: 20px 0;
      }
      
      .completion-icon {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }
      
      .completion-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .completion-message {
        font-size: 13px;
        opacity: 0.9;
        margin-bottom: 20px;
        line-height: 1.4;
      }
      
      .step-navigation {
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .back-button {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      
      .back-button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
      
      .cta-button {
        background: white;
        color: #CC0000;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s ease;
      }
      
      .cta-button:hover:not(:disabled) {
        background: #f0f0f0;
        transform: translateY(-1px);
      }
      
      .cta-button:disabled {
        background: rgba(255, 255, 255, 0.5);
        color: rgba(204, 0, 0, 0.5);
        cursor: not-allowed;
        transform: none;
      }
      
      .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        margin-bottom: 16px;
      }
      
      .progress-fill {
        height: 100%;
        background: white;
        transition: width 0.3s ease;
      }
      
      .comparison-toggle {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        margin-bottom: 16px;
        width: 100%;
      }
      
      .comparison-table {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 12px;
        font-size: 11px;
        margin-bottom: 16px;
      }
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .summary-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        font-weight: 600;
      }
      
      @media (max-width: 320px) {
        .step-content {
          padding: 12px;
        }
        
        .hero-title {
          font-size: 20px;
        }
        
        .color-options {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  getTemplate() {
    const progress = ((this.steps.indexOf(this.state.currentStep) + 1) / this.steps.length) * 100;
    
    return `
      <div class="toyota-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="toyota-logo">TOYOTA</div>
        <div class="step-content">
          ${this.getStepContent()}
        </div>
        ${this.getStepNavigation()}
      </div>
    `;
  }

  getStepContent() {
    switch (this.state.currentStep) {
      case 'hero':
        return this.getHeroContent();
      case 'selection':
        return this.getSelectionContent();
      case 'customize':
        return this.getCustomizeContent();
      case 'details':
        return this.getDetailsContent();
      case 'complete':
        return this.getCompleteContent();
      default:
        return this.getHeroContent();
    }
  }

  getHeroContent() {
    return `
      <div class="hero-section">
        <h2 class="hero-title">Explore Toyota SUVs</h2>
        <p class="hero-subtitle">Find your perfect adventure companion</p>
        <div class="hero-image">
          Toyota SUV Collection
        </div>
        <p style="font-size: 12px; opacity: 0.9; line-height: 1.4;">
          Discover our lineup of reliable, capable SUVs designed for every adventure. 
          From city commuting to off-road exploration.
        </p>
      </div>
    `;
  }

  getSelectionContent() {
    return `
      <div class="vehicle-selection">
        <h3 class="section-title">Choose Your SUV</h3>
        <div class="vehicle-grid">
          ${this.data.vehicles.map(vehicle => `
            <div class="vehicle-card ${this.state.selectedVehicle?.id === vehicle.id ? 'selected' : ''}" 
                 data-action="select-vehicle" data-vehicle-id="${vehicle.id}">
              <div class="vehicle-name">${vehicle.name}</div>
              <div class="vehicle-category">${vehicle.category}</div>
              <div class="vehicle-price">Starting at $${vehicle.startingPrice.toLocaleString()}</div>
              <div class="vehicle-features">${vehicle.features.join(' " ')}</div>
            </div>
          `).join('')}
        </div>
        ${this.state.selectedVehicle ? `
          <button class="comparison-toggle" data-action="toggle-comparison">
            ${this.state.showComparison ? 'Hide' : 'Show'} Comparison
          </button>
          ${this.state.showComparison ? this.getComparisonTable() : ''}
        ` : ''}
      </div>
    `;
  }

  getComparisonTable() {
    return `
      <div class="comparison-table">
        <div style="font-weight: 600; margin-bottom: 8px;">Compare Models</div>
        ${this.data.vehicles.map(vehicle => `
          <div style="margin-bottom: 8px;">
            <strong>${vehicle.name}</strong><br>
            ${vehicle.mpg} MPG " $${vehicle.startingPrice.toLocaleString()}
          </div>
        `).join('')}
      </div>
    `;
  }

  getCustomizeContent() {
    if (!this.state.selectedVehicle) return '';
    
    return `
      <div class="customization">
        <h3 class="section-title">Customize Your ${this.state.selectedVehicle.name}</h3>
        
        <div class="customization-section">
          <h4 style="font-size: 14px; margin-bottom: 10px;">Select Trim Level</h4>
          <div class="trim-options">
            ${this.state.selectedVehicle.trims.map(trim => `
              <div class="trim-option ${this.state.selectedTrim?.id === trim.id ? 'selected' : ''}" 
                   data-action="select-trim" data-trim-id="${trim.id}">
                <div class="trim-name">${trim.name}</div>
                <div class="trim-price">$${trim.price.toLocaleString()}</div>
                <div class="trim-description">${trim.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="customization-section">
          <h4 style="font-size: 14px; margin-bottom: 10px;">Choose Color</h4>
          <div class="color-options">
            ${this.state.selectedVehicle.colors.map(color => `
              <div class="color-option ${this.state.selectedColor?.id === color.id ? 'selected' : ''}" 
                   data-action="select-color" data-color-id="${color.id}">
                <div class="color-swatch" style="background-color: ${color.hex}"></div>
                <div class="color-name">${color.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  getDetailsContent() {
    return `
      <div class="details-section">
        <h3 class="section-title">Almost There!</h3>
        
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 12px; margin-bottom: 16px;">
          <div class="summary-item">
            <span>Vehicle:</span>
            <span>${this.state.selectedVehicle?.name} ${this.state.selectedTrim?.name || ''}</span>
          </div>
          <div class="summary-item">
            <span>Color:</span>
            <span>${this.state.selectedColor?.name || 'Not selected'}</span>
          </div>
          <div class="summary-item">
            <span>Price:</span>
            <span>$${this.state.selectedTrim?.price?.toLocaleString() || 'TBD'}</span>
          </div>
        </div>
        
        <div class="dealer-info">
          <div class="dealer-name">${this.data.dealerInfo.name}</div>
          <div class="dealer-details">
            ${this.data.dealerInfo.address}<br>
            ${this.data.dealerInfo.phone}<br>
            ${this.data.dealerInfo.hours}
          </div>
        </div>
        
        <div class="form-section">
          <label class="form-label">Name *</label>
          <input type="text" class="form-input" placeholder="Your full name" 
                 data-field="name" value="${this.state.contactForm.name || ''}">
        </div>
        
        <div class="form-section">
          <label class="form-label">Email *</label>
          <input type="email" class="form-input" placeholder="your@email.com" 
                 data-field="email" value="${this.state.contactForm.email || ''}">
        </div>
        
        <div class="form-section">
          <label class="form-label">Phone</label>
          <input type="tel" class="form-input" placeholder="(555) 123-4567" 
                 data-field="phone" value="${this.state.contactForm.phone || ''}">
        </div>
        
        <div class="form-section">
          <label class="form-label">Preferred Contact Time</label>
          <select class="form-input" data-field="contactTime">
            <option value="">Select time</option>
            <option value="morning" ${this.state.contactForm.contactTime === 'morning' ? 'selected' : ''}>Morning (9AM-12PM)</option>
            <option value="afternoon" ${this.state.contactForm.contactTime === 'afternoon' ? 'selected' : ''}>Afternoon (12PM-5PM)</option>
            <option value="evening" ${this.state.contactForm.contactTime === 'evening' ? 'selected' : ''}>Evening (5PM-8PM)</option>
          </select>
        </div>
      </div>
    `;
  }

  getCompleteContent() {
    return `
      <div class="completion-section">
        <div class="completion-icon"></div>
        <h3 class="completion-title">Request Submitted!</h3>
        <p class="completion-message">
          Thank you for your interest in the ${this.state.selectedVehicle?.name}. 
          A Toyota specialist will contact you within 1 business day to schedule your test drive.
        </p>
        <p style="font-size: 11px; opacity: 0.8; margin-bottom: 20px;">
          Reference #: TYT-${Date.now().toString().slice(-6)}
        </p>
      </div>
    `;
  }

  getStepNavigation() {
    const canGoBack = this.state.currentStep !== 'hero' && this.state.currentStep !== 'complete';
    const canGoForward = this.canProceed();
    
    return `
      <div class="step-navigation">
        ${canGoBack ? `
          <button class="back-button" data-action="back">
            ê Back
          </button>
        ` : '<div></div>'}
        
        ${this.state.currentStep === 'complete' ? `
          <button class="cta-button" data-action="visit-toyota">
            Visit Toyota.com
          </button>
        ` : `
          <button class="cta-button" data-action="next" ${!canGoForward ? 'disabled' : ''}>
            ${this.getNextButtonText()}
          </button>
        `}
      </div>
    `;
  }

  getNextButtonText() {
    switch (this.state.currentStep) {
      case 'hero':
        return 'Start Shopping í';
      case 'selection':
        return 'Customize í';
      case 'customize':
        return 'Get Details í';
      case 'details':
        return 'Schedule Test Drive';
      default:
        return 'Next í';
    }
  }

  canProceed() {
    switch (this.state.currentStep) {
      case 'hero':
        return true;
      case 'selection':
        return !!this.state.selectedVehicle;
      case 'customize':
        return !!(this.state.selectedTrim && this.state.selectedColor);
      case 'details':
        return !!(this.state.contactForm.name && this.state.contactForm.email);
      default:
        return false;
    }
  }

  setupComponentEventListeners() {
    this.shadowRoot.addEventListener('click', this.handleComponentClick.bind(this));
    this.shadowRoot.addEventListener('input', this.handleFormInput.bind(this));
    this.shadowRoot.addEventListener('change', this.handleFormInput.bind(this));
  }

  handleComponentClick(event) {
    const action = event.target.dataset.action;
    if (!action) return;

    event.preventDefault();
    
    switch (action) {
      case 'select-vehicle':
        this.selectVehicle(event.target.dataset.vehicleId);
        break;
      case 'select-trim':
        this.selectTrim(event.target.dataset.trimId);
        break;
      case 'select-color':
        this.selectColor(event.target.dataset.colorId);
        break;
      case 'toggle-comparison':
        this.toggleComparison();
        break;
      case 'next':
        this.nextStep();
        break;
      case 'back':
        this.previousStep();
        break;
      case 'visit-toyota':
        this.visitToyota();
        break;
    }
  }

  handleFormInput(event) {
    const field = event.target.dataset.field;
    if (field) {
      this.updateContactForm(field, event.target.value);
    }
  }

  selectVehicle(vehicleId) {
    const vehicle = this.data.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      this.setState({ 
        selectedVehicle: vehicle,
        selectedTrim: null,
        selectedColor: null 
      });
      this.handleUserInteraction('select-vehicle', { 
        vehicleId, 
        vehicleName: vehicle.name,
        category: vehicle.category 
      });
    }
  }

  selectTrim(trimId) {
    const trim = this.state.selectedVehicle.trims.find(t => t.id === trimId);
    if (trim) {
      this.setState({ selectedTrim: trim });
      this.handleUserInteraction('select-trim', { 
        trimId, 
        trimName: trim.name,
        price: trim.price 
      });
    }
  }

  selectColor(colorId) {
    const color = this.state.selectedVehicle.colors.find(c => c.id === colorId);
    if (color) {
      this.setState({ selectedColor: color });
      this.handleUserInteraction('select-color', { 
        colorId, 
        colorName: color.name 
      });
    }
  }

  toggleComparison() {
    this.setState({ showComparison: !this.state.showComparison });
    this.handleUserInteraction('toggle-comparison', { 
      showing: !this.state.showComparison 
    });
  }

  updateContactForm(field, value) {
    this.setState({ 
      contactForm: { ...this.state.contactForm, [field]: value }
    });
  }

  nextStep() {
    const currentIndex = this.steps.indexOf(this.state.currentStep);
    if (currentIndex < this.steps.length - 1) {
      const nextStep = this.steps[currentIndex + 1];
      this.setState({ currentStep: nextStep });
      this.handleUserInteraction('step-forward', { 
        from: this.state.currentStep, 
        to: nextStep 
      });
      
      if (nextStep === 'complete') {
        this.submitTestDriveRequest();
      }
    }
  }

  previousStep() {
    const currentIndex = this.steps.indexOf(this.state.currentStep);
    if (currentIndex > 0) {
      const prevStep = this.steps[currentIndex - 1];
      this.setState({ currentStep: prevStep });
      this.handleUserInteraction('step-back', { 
        from: this.state.currentStep, 
        to: prevStep 
      });
    }
  }

  submitTestDriveRequest() {
    const requestData = {
      vehicle: this.state.selectedVehicle.name,
      trim: this.state.selectedTrim.name,
      color: this.state.selectedColor.name,
      price: this.state.selectedTrim.price,
      contact: this.state.contactForm,
      dealer: this.data.dealerInfo.name,
      timestamp: Date.now()
    };

    this.handleUserInteraction('submit-test-drive', requestData);
    
    // In a real implementation, this would send data to Toyota's API
    console.log('Test drive request submitted:', requestData);
  }

  visitToyota() {
    const url = 'https://www.toyota.com/suv/';
    this.trackClickThrough(url);
    window.open(url, '_blank');
    this.handleUserInteraction('visit-website', { destination: url });
  }

  onStateChange(prevState, newState) {
    if (prevState.currentStep !== newState.currentStep) {
      this.render();
    } else if (
      prevState.selectedVehicle !== newState.selectedVehicle ||
      prevState.selectedTrim !== newState.selectedTrim ||
      prevState.selectedColor !== newState.selectedColor ||
      prevState.showComparison !== newState.showComparison
    ) {
      this.render();
    }
  }

  getAccessibilityLabel() {
    return `Toyota SUV Interactive Showcase - ${this.state.currentStep} step`;
  }

  setData(data) {
    super.setData(data);
    
    // Override dealer info if provided
    if (data.dealerInfo) {
      this.data.dealerInfo = { ...this.data.dealerInfo, ...data.dealerInfo };
    }
    
    // Override vehicles if provided
    if (data.vehicles) {
      this.data.vehicles = data.vehicles;
    }
  }
}

// Register the custom element
customElements.define('toyota-suv-showcase', ToyotaSUVShowcase);

// Make available globally and for module systems
if (typeof window !== 'undefined') {
  window.ToyotaSUVShowcase = ToyotaSUVShowcase;
}

export default ToyotaSUVShowcase;