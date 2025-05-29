/**
 * COMPONENT_NAME Web Component Template
 * 
 * Replace COMPONENT_NAME with your actual component name in PascalCase
 * Replace component-tag-name with your kebab-case tag name
 * Replace all TODO comments with your implementation
 * 
 * This template provides the standard structure for all Firsthand Demo Assistant components
 */

// TODO: Import BaseAdUnit if needed
// import { BaseAdUnit } from '../base/base-ad-unit.js';

class COMPONENT_NAME extends BaseAdUnit {
  constructor() {
    super();
    
    // TODO: Define component-specific initial state
    this.state = {
      ...this.state,
      currentStep: 'initial',
      selectedProduct: null,
      formData: {},
      // Add your component-specific state here
    };
    
    // TODO: Define component-specific data structure
    this.data = {
      products: [],
      config: {},
      // Add your component-specific data here
    };
    
    // TODO: Define component steps/flow if multi-step
    this.steps = [
      'initial',
      'selection',
      'details',
      'completion'
    ];
  }

  // TODO: Override to set component dimensions
  getWidth() {
    return '300px'; // Change to your component width
  }

  getHeight() {
    return '600px'; // Change to your component height
  }

  // TODO: Define component-specific styles
  getStyles() {
    return `
      /* Component-specific styles */
      .step-container {
        padding: 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .step-header {
        margin-bottom: 16px;
      }
      
      .step-title {
        font-size: 18px;
        font-weight: 600;
        color: #202124;
        margin: 0 0 4px 0;
      }
      
      .step-subtitle {
        font-size: 14px;
        color: #5f6368;
        margin: 0;
      }
      
      .step-content {
        flex: 1;
        overflow-y: auto;
      }
      
      .step-actions {
        margin-top: 16px;
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }
      
      .product-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .product-card {
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      }
      
      .product-card:hover {
        border-color: #1a73e8;
        background: #f8f9fa;
      }
      
      .product-card.selected {
        border-color: #1a73e8;
        background: #e8f0fe;
      }
      
      .product-image {
        width: 100%;
        height: 80px;
        background: #f1f3f4;
        border-radius: 4px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #5f6368;
      }
      
      .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #202124;
        margin-bottom: 4px;
      }
      
      .product-price {
        font-size: 12px;
        color: #1a73e8;
        font-weight: 600;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #202124;
        margin-bottom: 6px;
      }
      
      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #dadce0;
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
      }
      
      .form-input:focus {
        outline: none;
        border-color: #1a73e8;
        box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
      }
      
      .back-button {
        background: none;
        border: 1px solid #dadce0;
        color: #5f6368;
        padding: 10px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      
      .back-button:hover {
        background: #f8f9fa;
        border-color: #1a73e8;
        color: #1a73e8;
      }
      
      .completion-message {
        text-align: center;
        padding: 40px 20px;
      }
      
      .completion-icon {
        width: 60px;
        height: 60px;
        background: #34a853;
        border-radius: 50%;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
      }
      
      .completion-title {
        font-size: 18px;
        font-weight: 600;
        color: #202124;
        margin-bottom: 8px;
      }
      
      .completion-subtitle {
        font-size: 14px;
        color: #5f6368;
        margin-bottom: 24px;
      }
    `;
  }

  // TODO: Define the main component template
  getTemplate() {
    switch (this.state.currentStep) {
      case 'initial':
        return this.getInitialTemplate();
      case 'selection':
        return this.getSelectionTemplate();
      case 'details':
        return this.getDetailsTemplate();
      case 'completion':
        return this.getCompletionTemplate();
      default:
        return this.getInitialTemplate();
    }
  }

  // TODO: Implement step templates
  getInitialTemplate() {
    return `
      <div class="step-container">
        <div class="step-header">
          <h3 class="step-title">Welcome to COMPONENT_NAME</h3>
          <p class="step-subtitle">Get started with our interactive experience</p>
        </div>
        <div class="step-content">
          <p>TODO: Add your initial step content here</p>
          <p>This could be an intro message, hero image, or overview of what users will do.</p>
        </div>
        <div class="step-actions">
          <div></div>
          <button class="cta-button" data-action="start">
            Get Started
          </button>
        </div>
      </div>
    `;
  }

  getSelectionTemplate() {
    return `
      <div class="step-container">
        <div class="step-header">
          <h3 class="step-title">Choose Your Option</h3>
          <p class="step-subtitle">Select from our available options</p>
        </div>
        <div class="step-content">
          <div class="product-grid">
            ${this.data.products.map(product => `
              <div class="product-card ${this.state.selectedProduct?.id === product.id ? 'selected' : ''}" 
                   data-action="select-product" data-product-id="${product.id}">
                <div class="product-image">${product.name} Image</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="step-actions">
          <button class="back-button" data-action="back">
            Back
          </button>
          <button class="cta-button" data-action="continue" ${!this.state.selectedProduct ? 'disabled' : ''}>
            Continue
          </button>
        </div>
      </div>
    `;
  }

  getDetailsTemplate() {
    return `
      <div class="step-container">
        <div class="step-header">
          <h3 class="step-title">Your Details</h3>
          <p class="step-subtitle">Tell us a bit about yourself</p>
        </div>
        <div class="step-content">
          <div class="form-group">
            <label class="form-label" for="name">Name</label>
            <input type="text" id="name" class="form-input" 
                   data-field="name" value="${this.state.formData.name || ''}" 
                   placeholder="Enter your name">
          </div>
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input type="email" id="email" class="form-input" 
                   data-field="email" value="${this.state.formData.email || ''}" 
                   placeholder="Enter your email">
          </div>
          <div class="form-group">
            <label class="form-label" for="phone">Phone (Optional)</label>
            <input type="tel" id="phone" class="form-input" 
                   data-field="phone" value="${this.state.formData.phone || ''}" 
                   placeholder="Enter your phone number">
          </div>
        </div>
        <div class="step-actions">
          <button class="back-button" data-action="back">
            Back
          </button>
          <button class="cta-button" data-action="submit" 
                  ${!this.isFormValid() ? 'disabled' : ''}>
            Submit
          </button>
        </div>
      </div>
    `;
  }

  getCompletionTemplate() {
    return `
      <div class="step-container">
        <div class="completion-message">
          <div class="completion-icon"></div>
          <h3 class="completion-title">Thank You!</h3>
          <p class="completion-subtitle">
            We've received your information and will be in touch soon.
          </p>
          <button class="cta-button" data-action="learn-more">
            Learn More
          </button>
        </div>
      </div>
    `;
  }

  // TODO: Set up component-specific event listeners
  setupComponentEventListeners() {
    // Handle all clicks through delegation
    this.shadowRoot.addEventListener('click', this.handleComponentClick.bind(this));
    
    // Handle form inputs
    this.shadowRoot.addEventListener('input', this.handleFormInput.bind(this));
    
    // Handle keyboard navigation
    this.shadowRoot.addEventListener('keydown', this.handleComponentKeydown.bind(this));
  }

  handleComponentClick(event) {
    const action = event.target.dataset.action;
    if (!action) return;

    event.preventDefault();
    
    switch (action) {
      case 'start':
        this.startExperience();
        break;
      case 'select-product':
        this.selectProduct(event.target.dataset.productId);
        break;
      case 'continue':
        this.nextStep();
        break;
      case 'back':
        this.previousStep();
        break;
      case 'submit':
        this.submitForm();
        break;
      case 'learn-more':
        this.openLearnMore();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  handleFormInput(event) {
    const field = event.target.dataset.field;
    if (field) {
      this.updateFormData(field, event.target.value);
    }
  }

  handleComponentKeydown(event) {
    // TODO: Add keyboard navigation logic
    if (event.key === 'Escape') {
      this.goToStep('initial');
    }
  }

  // TODO: Implement component-specific methods
  startExperience() {
    this.handleUserInteraction('start');
    this.goToStep('selection');
  }

  selectProduct(productId) {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      this.setState({ selectedProduct: product });
      this.handleUserInteraction('select-product', { productId, productName: product.name });
    }
  }

  nextStep() {
    const currentIndex = this.steps.indexOf(this.state.currentStep);
    if (currentIndex < this.steps.length - 1) {
      const nextStep = this.steps[currentIndex + 1];
      this.goToStep(nextStep);
      this.handleUserInteraction('next-step', { from: this.state.currentStep, to: nextStep });
    }
  }

  previousStep() {
    const currentIndex = this.steps.indexOf(this.state.currentStep);
    if (currentIndex > 0) {
      const prevStep = this.steps[currentIndex - 1];
      this.goToStep(prevStep);
      this.handleUserInteraction('previous-step', { from: this.state.currentStep, to: prevStep });
    }
  }

  goToStep(step) {
    this.setState({ currentStep: step });
    this.render();
    this.updateProgressIndicator();
  }

  updateFormData(field, value) {
    this.setState({ 
      formData: { ...this.state.formData, [field]: value }
    });
    // Re-render to update button states
    this.render();
  }

  isFormValid() {
    return this.state.formData.name && 
           this.state.formData.email && 
           this.isValidEmail(this.state.formData.email);
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  submitForm() {
    if (!this.isFormValid()) {
      return;
    }

    this.handleUserInteraction('submit-form', {
      selectedProduct: this.state.selectedProduct,
      formData: this.state.formData
    });

    // TODO: Add actual form submission logic here
    console.log('Form submitted:', {
      product: this.state.selectedProduct,
      formData: this.state.formData
    });

    this.goToStep('completion');
  }

  openLearnMore() {
    const url = this.data.config.learnMoreUrl || 'https://example.com';
    this.trackClickThrough(url);
    window.open(url, '_blank');
    this.handleUserInteraction('click-through', { destination: url });
  }

  updateProgressIndicator() {
    // TODO: Add progress indicator if needed
    const currentIndex = this.steps.indexOf(this.state.currentStep);
    const progressContainer = this.shadowRoot.querySelector('.progress-indicator');
    
    if (progressContainer) {
      const dots = progressContainer.querySelectorAll('.progress-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
        dot.classList.toggle('completed', index < currentIndex);
      });
    }
  }

  // TODO: Override state change handler if needed
  onStateChange(prevState, newState) {
    // Handle component-specific state changes
    if (prevState.currentStep !== newState.currentStep) {
      this.onStepChange(prevState.currentStep, newState.currentStep);
    }
  }

  onStepChange(fromStep, toStep) {
    // TODO: Add step transition logic
    console.log(`Step changed from ${fromStep} to ${toStep}`);
  }

  // TODO: Override data setter if needed
  setData(data) {
    super.setData(data);
    
    // Set default products if none provided
    if (!this.data.products || this.data.products.length === 0) {
      this.data.products = [
        { id: '1', name: 'Option 1', price: '$99' },
        { id: '2', name: 'Option 2', price: '$149' },
        { id: '3', name: 'Option 3', price: '$199' },
        { id: '4', name: 'Option 4', price: '$249' }
      ];
    }
  }

  // TODO: Override accessibility label
  getAccessibilityLabel() {
    return `Interactive COMPONENT_NAME advertisement - Step ${this.state.currentStep}`;
  }

  // TODO: Add component-specific cleanup
  cleanup() {
    // Clean up any component-specific resources
    super.cleanup();
  }
}

// TODO: Register the custom element
customElements.define('component-tag-name', COMPONENT_NAME);

// TODO: Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COMPONENT_NAME;
}

// TODO: Make available globally
if (typeof window !== 'undefined') {
  window.COMPONENT_NAME = COMPONENT_NAME;
}

export default COMPONENT_NAME;