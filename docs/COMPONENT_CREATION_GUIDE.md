# Component Creation Guide

## Creating Interactive Ad Components for Firsthand Demo Assistant v2.0

This guide walks you through creating high-quality, interactive ad components that integrate seamlessly with the Firsthand Demo Assistant platform.

## <� Overview

Interactive ad components are Web Components that provide engaging, multi-step experiences for potential customers. They combine product information, customization options, and lead capture in a cohesive, branded experience.

### Component Philosophy
- **Reliability First** - Components must work consistently across all publisher sites
- **Engagement Focused** - Interactive experiences that guide users through a journey
- **Performance Optimized** - Fast loading, smooth interactions, minimal resource usage
- **Accessibility Compliant** - Usable by everyone, including assistive technology users

## =� Requirements Checklist

Before you begin, ensure you understand these requirements:

### Technical Requirements
- [ ] **Web Component Standards** - Must use Custom Elements v1 and Shadow DOM
- [ ] **Base Class Extension** - Extend `BaseAdUnit` for consistency and functionality
- [ ] **Shadow DOM Isolation** - Use closed shadow DOM for style and script isolation
- [ ] **Performance Limits** - <100KB total size, <1s load time
- [ ] **Browser Support** - Chrome 88+, Firefox 88+, Safari 14+, Edge 88+

### Content Requirements
- [ ] **Complete Metadata** - All required fields in component metadata JSON
- [ ] **Accessibility** - WCAG-AA compliance minimum
- [ ] **Brand Guidelines** - Follow advertiser brand standards
- [ ] **Demo Value** - Clear value proposition for sales demonstrations

### Quality Requirements
- [ ] **Validation Passing** - Pass all component validator checks
- [ ] **Testing Coverage** - Test across multiple browsers and sites
- [ ] **Documentation** - Clear usage instructions and demo context

## =� Step-by-Step Creation Process

### Step 1: Planning Your Component

#### Define the User Journey
Map out the complete user experience:
1. **Initial Hook** - What captures attention?
2. **Information Gathering** - What do users need to know?
3. **Interaction Points** - Where do users make choices?
4. **Value Delivery** - What value do users receive?
5. **Conversion Action** - What's the desired outcome?

#### Example: Toyota SUV Component Journey
1. **Hook**: Explore Toyota SUVs headline with vehicle showcase
2. **Information**: Compare RAV4, Highlander, and 4Runner specs
3. **Interaction**: Select vehicle, choose trim level and color
4. **Value**: Personalized configuration with pricing
5. **Conversion**: Schedule test drive with dealer contact

#### Choose Component Type
- **Interactive Experience** - Multi-step journey with high engagement
- **Product Showcase** - Product catalog or gallery display  
- **Form Capture** - Lead generation with progressive disclosure
- **Calculator Tool** - Interactive tools that provide personalized results
- **Quiz Assessment** - Personalized recommendations based on answers

### Step 2: Set Up File Structure

Create your component files in the correct directory structure:

```
ad-unit-library/components/
   [advertiser-vertical]/     # e.g., auto-tier-1, cpg-food
      [advertiser]/          # e.g., toyota, coca-cola
          [context]/         # e.g., sport-sites, lifestyle
              component-name.js      # Web Component code
              component-name.json    # Metadata
              assets/               # Images, icons, etc.
```

#### Naming Conventions
- **Component ID**: `kebab-case` (e.g., `toyota-suv-interactive-showcase`)
- **File Names**: Match component ID (e.g., `toyota-suv-showcase.js`)
- **Class Names**: `PascalCase` (e.g., `ToyotaSUVShowcase`)
- **Custom Element**: `kebab-case` (e.g., `toyota-suv-showcase`)

### Step 3: Create Component Code

#### Start with the Template

Copy the Web Component template and customize:

```javascript
// Copy from: ad-unit-library/templates/web-component-template.js

class YourComponentName extends BaseAdUnit {
  constructor() {
    super();
    
    // Define component-specific state
    this.state = {
      ...this.state,
      currentStep: 'initial',
      selectedOptions: {},
      formData: {}
    };
    
    // Define component data
    this.data = {
      products: [],
      config: {},
      // Your component-specific data
    };
    
    // Define component flow
    this.steps = ['initial', 'selection', 'details', 'completion'];
  }

  getWidth() {
    return '300px'; // Your component width
  }

  getHeight() {
    return '600px'; // Your component height
  }

  getStyles() {
    return `
      /* Your component-specific styles */
      .component-container {
        /* Styles scoped to shadow DOM */
      }
    `;
  }

  getTemplate() {
    return `
      <div class="component-container">
        ${this.getStepContent()}
      </div>
    `;
  }

  // Implement your component logic here
}

customElements.define('your-element-name', YourComponentName);
export default YourComponentName;
```

#### Component Structure Guidelines

**Constructor Requirements**:
- Call `super()` first
- Initialize component-specific state
- Set up data structures
- Define step flow if multi-step

**Required Methods**:
- `getTemplate()` - Returns HTML structure
- `getStyles()` - Returns CSS styles  
- `setupComponentEventListeners()` - Event handling
- `handleUserInteraction()` - Analytics and state management

**Optional Override Methods**:
- `getWidth()` / `getHeight()` - Component dimensions
- `onStateChange()` - React to state changes
- `setData()` - Handle external data
- `cleanup()` - Component cleanup

### Step 4: Implement Core Functionality

#### State Management
Use the inherited state system for managing component data:

```javascript
// Update state
this.setState({ currentStep: 'selection' });

// React to state changes
onStateChange(prevState, newState) {
  if (prevState.currentStep !== newState.currentStep) {
    this.render(); // Re-render on step change
  }
}
```

#### Event Handling
Handle user interactions consistently:

```javascript
setupComponentEventListeners() {
  this.shadowRoot.addEventListener('click', this.handleClick.bind(this));
  this.shadowRoot.addEventListener('input', this.handleFormInput.bind(this));
}

handleClick(event) {
  const action = event.target.dataset.action;
  if (action) {
    this.handleUserInteraction(action, {
      target: event.target.textContent,
      value: event.target.dataset.value
    });
  }
}
```

#### Analytics Integration
Track meaningful user interactions:

```javascript
// Track significant interactions
this.handleUserInteraction('select-product', {
  productId: selectedProduct.id,
  productName: selectedProduct.name,
  price: selectedProduct.price
});

// Track form submissions
this.handleUserInteraction('submit-form', {
  formData: this.state.formData,
  completionTime: Date.now() - this.analytics.startTime
});

// Track external clicks
this.handleUserInteraction('click-through', {
  destination: url,
  context: 'learn-more-button'
});
```

### Step 5: Style Your Component

#### Shadow DOM CSS Guidelines

Use `:host` for component-level styles:

```css
:host {
  display: block;
  width: 300px;
  height: 600px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  contain: layout style paint size;
  box-sizing: border-box;
}

/* All styles are automatically scoped to shadow DOM */
.container {
  width: 100%;
  height: 100%;
  padding: 16px;
}

.button {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
```

#### Responsive Design
Support different screen sizes:

```css
@media (max-width: 320px) {
  :host {
    /* Mobile adjustments */
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :host {
    /* Dark mode support */
  }
}
```

#### Brand Consistency
Follow advertiser brand guidelines:

```css
/* Toyota brand colors example */
:host {
  --toyota-red: #FF0000;
  --toyota-dark-red: #CC0000;
  --toyota-black: #000000;
  --toyota-gray: #666666;
}

.toyota-button {
  background: var(--toyota-red);
  color: white;
}

.toyota-button:hover {
  background: var(--toyota-dark-red);
}
```

### Step 6: Create Component Metadata

Fill out the complete metadata template:

```json
{
  "id": "your-component-id",
  "componentName": "your-component-file-name",
  "name": "Human Readable Component Name",
  "description": "Detailed description of component functionality and user experience",
  "version": "1.0",
  "created": "2025-05-28",
  "contributor": "your-email@company.com",
  
  "webComponent": {
    "className": "YourComponentClassName",
    "tagName": "your-element-tag",
    "shadowDom": true,
    "dependencies": ["BaseAdUnit"]
  },
  
  "taxonomy": {
    "advertiser": "Brand Name",
    "advertiserVertical": "Auto Tier 1",
    "publisher": "Target Publisher",
    "domain": "www.targetsite.com",
    "domainVertical": "Sports",
    "adUnitType": "Interactive Experience",
    "dimensions": "300x600",
    "interactionLevel": "high"
  },
  
  "technicalSpecs": {
    "shadowDomIsolation": true,
    "cspCompliant": true,
    "accessibility": "WCAG-AA",
    "bundleSize": "85kb",
    "loadTime": "< 1s",
    "mobileOptimized": true
  },
  
  "demoContext": {
    "bestFor": [
      "Context where this component works best",
      "Target audience description",
      "Optimal placement scenarios"
    ],
    "keyFeatures": [
      "Primary interactive feature",
      "Secondary valuable feature", 
      "Unique selling point"
    ],
    "talkingPoints": [
      "Engagement metric with specific numbers",
      "Business value proposition",
      "Technical advantage over alternatives"
    ]
  },
  
  "assets": {
    "componentFile": "your-component.js",
    "thumbnailPreview": "your-component-preview.png",
    "requiredImages": [
      {
        "placeholder": "Product hero image",
        "dimensions": "300x200px"
      }
    ]
  }
}
```

#### Metadata Field Guidelines

**Required Fields**: Must be completed for component to be valid
- Basic info: `id`, `name`, `description`, `version`, `created`, `contributor`
- Web Component: `className`, `tagName`, `shadowDom`
- Taxonomy: `advertiser`, `advertiserVertical`, `adUnitType`, `dimensions`
- Technical: `shadowDomIsolation`, `cspCompliant`, `accessibility`, `bundleSize`, `loadTime`

**Recommended Fields**: Improve searchability and demo effectiveness
- Demo context: `bestFor`, `keyFeatures`, `talkingPoints`
- Assets: `thumbnailPreview`
- Technical: `mobileOptimized`

### Step 7: Implement Accessibility

#### ARIA Attributes
Add proper ARIA labels and descriptions:

```javascript
getTemplate() {
  return `
    <div class="container" role="region" aria-label="Interactive ${this.name} experience">
      <button 
        class="next-btn" 
        aria-describedby="next-help"
        data-action="next">
        Next Step
      </button>
      <div id="next-help" class="sr-only">
        Proceed to vehicle customization options
      </div>
    </div>
  `;
}
```

#### Keyboard Navigation
Support keyboard users:

```javascript
setupComponentEventListeners() {
  super.setupComponentEventListeners();
  
  this.shadowRoot.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target;
      if (target.classList.contains('interactive-element')) {
        event.preventDefault();
        target.click();
      }
    }
  });
}
```

#### Screen Reader Support
Provide meaningful text alternatives:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Step 8: Test Your Component

#### Manual Testing Checklist
- [ ] **Functionality** - All interactions work as expected
- [ ] **Visual Design** - Matches brand guidelines and design specs
- [ ] **Responsive** - Works on different screen sizes
- [ ] **Accessibility** - Keyboard navigation and screen reader support
- [ ] **Performance** - Fast loading and smooth interactions
- [ ] **Cross-browser** - Works in Chrome, Firefox, Safari, Edge
- [ ] **Cross-site** - Works on different publisher websites

#### Automated Validation
Run the component validator:

```bash
node tools/component-validator.js your-component.js your-metadata.json
```

Fix any errors or warnings before proceeding.

#### Test Injection
Test component injection on real websites:

1. Load the Chrome extension with your component
2. Visit target publisher websites
3. Test injection with different CSS selectors
4. Verify no styling conflicts or JavaScript errors
5. Test on mobile devices if applicable

### Step 9: Document Your Component

#### Demo Instructions
Create clear instructions for sales demonstrations:

```markdown
## Toyota SUV Showcase - Demo Guide

### Best Use Cases
- Sports content with adventure/outdoor themes
- Automotive sections of news sites
- Lifestyle content targeting families
- High-traffic sidebar placements

### Demo Flow
1. **Setup**: Pre-select component in extension
2. **Context**: Explain SUV market and Toyota's position
3. **Injection**: Demonstrate reliable technical execution
4. **Journey**: Walk through complete user experience
5. **Analytics**: Highlight engagement and conversion tracking

### Key Talking Points
- 400% higher engagement vs static ads
- Complete lead capture funnel
- Zero technical failures with Shadow DOM
- Contextual relevance increases consideration by 65%
```

#### Technical Documentation
Document any special configuration or integration notes:

```markdown
## Technical Notes

### Configuration Options
- Dealer information can be customized per campaign
- Vehicle lineup can be filtered by price range
- CTA text configurable for different campaign goals

### Integration Requirements
- Requires minimum 300x600px placement area
- Works best in sidebar or in-content placements
- No external dependencies beyond base framework

### Performance Characteristics
- Initial load: ~800ms
- Bundle size: 85KB compressed
- Memory usage: <5MB
- CPU impact: Minimal
```

### Step 10: Submit Your Component

#### Pre-submission Checklist
- [ ] Component code follows all guidelines
- [ ] Metadata is complete and accurate
- [ ] All validation checks pass
- [ ] Component tested across browsers and sites
- [ ] Documentation is comprehensive
- [ ] Demo video created (recommended)

#### Submission Process
1. **Place Files**: Put component files in correct directory structure
2. **Run Builder**: Execute `node tools/library-builder.js` to update indexes
3. **Create PR**: Submit pull request with component files
4. **Include Demo**: Add demo video or screenshots
5. **Documentation**: Include usage instructions and demo guide

#### Review Process
Components undergo review for:
- Technical compliance with standards
- Demo effectiveness and sales value
- Brand guideline adherence
- Accessibility compliance
- Performance requirements

## <� Design Guidelines

### Visual Hierarchy
- **Clear CTAs** - Primary actions should be visually prominent
- **Progressive Disclosure** - Reveal information in logical steps
- **Visual Feedback** - Provide immediate response to user actions
- **Loading States** - Show progress for multi-step experiences

### Interaction Patterns
- **Familiar Controls** - Use standard UI patterns users expect
- **Error Prevention** - Validate inputs and guide correct usage
- **Undo Options** - Allow users to go back and change selections
- **Clear Progress** - Show where users are in multi-step flows

### Brand Integration
- **Color Schemes** - Use advertiser brand colors consistently
- **Typography** - Follow brand font guidelines when possible
- **Imagery** - Use high-quality, brand-appropriate images
- **Voice & Tone** - Match advertiser communication style

## =� Performance Best Practices

### Code Optimization
- **Minimize Bundle Size** - Remove unused code and dependencies
- **Lazy Loading** - Load content on-demand when possible
- **Efficient DOM** - Minimize DOM queries and updates
- **Memory Management** - Clean up event listeners and resources

### Asset Optimization
- **Image Compression** - Use WebP format when possible
- **Icon Fonts** - Consider SVG icons for scalability
- **External Resources** - Minimize external requests
- **Caching** - Use appropriate cache headers

### User Experience
- **Fast First Paint** - Show content quickly, enhance progressively
- **Smooth Animations** - Use CSS transforms for smooth motion
- **Responsive Loading** - Adapt to different connection speeds
- **Graceful Degradation** - Provide fallbacks for failed loads

## =' Advanced Techniques

### Multi-step Experiences
```javascript
// State-driven step management
this.steps = ['intro', 'selection', 'customize', 'details', 'complete'];

nextStep() {
  const currentIndex = this.steps.indexOf(this.state.currentStep);
  if (currentIndex < this.steps.length - 1) {
    this.setState({ currentStep: this.steps[currentIndex + 1] });
  }
}

// Progress indication
getProgressHTML() {
  const currentIndex = this.steps.indexOf(this.state.currentStep);
  const progress = ((currentIndex + 1) / this.steps.length) * 100;
  return `<div class="progress-bar" style="width: ${progress}%"></div>`;
}
```

### Data Integration
```javascript
// Handle external data sources
async loadProductData() {
  try {
    // In production, this might fetch from API
    const products = await this.fetchProducts();
    this.setData({ products });
  } catch (error) {
    this.showError('Failed to load product information');
  }
}

// Handle configuration
setData(data) {
  super.setData(data);
  
  // Override dealer info if provided
  if (data.dealerInfo) {
    this.data.dealerInfo = { ...this.data.dealerInfo, ...data.dealerInfo };
  }
}
```

### Error Handling
```javascript
// Graceful error handling
showError(message) {
  this.shadowRoot.innerHTML = `
    <div class="error-state">
      <p>We're sorry, but something went wrong.</p>
      <p>${message}</p>
      <button onclick="location.reload()">Try Again</button>
    </div>
  `;
}

// Fallback mode for CSP issues
enableFallbackMode() {
  this.shadowRoot.innerHTML = `
    <div class="fallback-mode">
      <h3>Interactive Experience</h3>
      <p>Learn more about our products</p>
      <button onclick="window.open('${this.getFallbackURL()}', '_blank')">
        Visit Website
      </button>
    </div>
  `;
}
```

## =� Analytics Integration

### Event Tracking
Track meaningful user interactions:

```javascript
// Component lifecycle events
trackImpression() {
  this.sendAnalyticsEvent('impression', {
    componentId: this.id,
    timestamp: Date.now(),
    url: window.location.href
  });
}

// User interaction events
handleUserInteraction(action, data) {
  super.handleUserInteraction(action, data);
  
  // Component-specific analytics
  if (action === 'complete-form') {
    this.sendAnalyticsEvent('conversion', {
      formData: data,
      timeToComplete: Date.now() - this.analytics.startTime
    });
  }
}
```

### Performance Monitoring
```javascript
// Track component performance
connectedCallback() {
  const startTime = performance.now();
  super.connectedCallback();
  
  const loadTime = performance.now() - startTime;
  this.sendAnalyticsEvent('performance', {
    loadTime,
    componentSize: this.getComponentSize()
  });
}
```

## = Debugging Tips

### Common Issues
1. **Styles not applying** - Check Shadow DOM CSS selectors
2. **Events not firing** - Verify event delegation setup
3. **Component not visible** - Check container dimensions
4. **Performance issues** - Profile with browser dev tools

### Debug Tools
```javascript
// Enable debug mode
window.firsthandDebug = {
  getComponentState: () => this.state,
  getComponentData: () => this.data,
  triggerAction: (action, data) => this.handleUserInteraction(action, data),
  rerender: () => this.render()
};
```

### Browser Dev Tools
- **Elements panel** - Inspect Shadow DOM structure
- **Console** - Check for JavaScript errors
- **Network** - Monitor resource loading
- **Performance** - Profile component performance

## =� Resources

### Templates & Examples
- **Web Component Template**: `ad-unit-library/templates/web-component-template.js`
- **Metadata Template**: `ad-unit-library/templates/metadata-template.json`
- **Toyota Example**: `ad-unit-library/components/auto-tier-1/toyota/`

### Documentation
- **Base Classes**: See `BaseAdUnit` documentation
- **Chrome Extension API**: Extension integration patterns
- **Web Components**: MDN Web Components guide
- **Shadow DOM**: Shadow DOM specification

### Tools & Validation
- **Component Validator**: `tools/component-validator.js`
- **Library Builder**: `tools/library-builder.js`
- **Chrome DevTools**: Web Component debugging
- **Accessibility Tools**: axe-core, WAVE, Lighthouse

---

**Ready to create engaging, reliable ad experiences that drive results!**