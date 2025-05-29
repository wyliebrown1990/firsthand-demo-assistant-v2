#!/usr/bin/env node

/**
 * Firsthand Demo Assistant Component Validator
 * Validates component files and metadata for compliance with standards
 */

const fs = require('fs');
const path = require('path');

class ComponentValidator {
  constructor() {
    this.validationRules = this.loadValidationRules();
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  loadValidationRules() {
    // Load validation rules from component registry or use defaults
    return {
      required: {
        webComponent: {
          mustExtend: 'HTMLElement',
          mustImplement: ['connectedCallback', 'disconnectedCallback'],
          shadowDomRequired: true,
          customElementsCompliant: true
        },
        metadata: {
          requiredFields: [
            'id', 'name', 'description', 'version', 'created', 'contributor',
            'taxonomy.advertiser', 'taxonomy.advertiserVertical', 
            'taxonomy.adUnitType', 'taxonomy.dimensions'
          ]
        },
        performance: {
          maxBundleSize: 102400, // 100KB
          maxLoadTime: 1000,
          minPerformanceScore: 80
        },
        accessibility: {
          minLevel: 'WCAG-AA',
          requiredFeatures: ['keyboard-navigation', 'screen-reader-support', 'aria-labels']
        }
      },
      recommended: {
        metadata: {
          recommendedFields: [
            'demoContext.bestFor',
            'demoContext.keyFeatures', 
            'demoContext.talkingPoints',
            'technicalSpecs.mobileOptimized',
            'assets.thumbnailPreview'
          ]
        },
        performance: {
          targetBundleSize: 51200, // 50KB
          targetLoadTime: 500,
          targetPerformanceScore: 95
        }
      }
    };
  }

  async validateComponent(componentPath, metadataPath) {
    console.log(`\n= Validating component: ${componentPath}`);
    
    this.errors = [];
    this.warnings = [];
    this.passed = [];

    // Validate files exist
    if (!fs.existsSync(componentPath)) {
      this.addError('FILE_NOT_FOUND', `Component file not found: ${componentPath}`);
      return this.getResults();
    }

    if (!fs.existsSync(metadataPath)) {
      this.addError('METADATA_NOT_FOUND', `Metadata file not found: ${metadataPath}`);
      return this.getResults();
    }

    // Load and parse files
    const componentCode = fs.readFileSync(componentPath, 'utf8');
    let metadata;
    
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (error) {
      this.addError('METADATA_PARSE_ERROR', `Invalid JSON in metadata file: ${error.message}`);
      return this.getResults();
    }

    // Run validation checks
    await this.validateMetadata(metadata);
    await this.validateComponentCode(componentCode, metadata);
    await this.validateWebComponentStandards(componentCode, metadata);
    await this.validatePerformance(componentPath, componentCode);
    await this.validateAccessibility(componentCode, metadata);
    await this.validateSecurityCompliance(componentCode);
    await this.validateBrowserCompatibility(componentCode);

    return this.getResults();
  }

  async validateMetadata(metadata) {
    console.log('  =Ë Validating metadata...');

    // Check required fields
    const requiredFields = this.validationRules.required.metadata.requiredFields;
    
    for (const field of requiredFields) {
      if (!this.getNestedProperty(metadata, field)) {
        this.addError('MISSING_REQUIRED_FIELD', `Missing required metadata field: ${field}`);
      } else {
        this.addPassed(`Required field present: ${field}`);
      }
    }

    // Check recommended fields
    const recommendedFields = this.validationRules.recommended.metadata.recommendedFields;
    
    for (const field of recommendedFields) {
      if (!this.getNestedProperty(metadata, field)) {
        this.addWarning('MISSING_RECOMMENDED_FIELD', `Missing recommended metadata field: ${field}`);
      } else {
        this.addPassed(`Recommended field present: ${field}`);
      }
    }

    // Validate specific field formats
    this.validateComponentId(metadata.id);
    this.validateDimensions(metadata.taxonomy?.dimensions);
    this.validateVersion(metadata.version);
    this.validateTaxonomy(metadata.taxonomy);
  }

  validateComponentId(id) {
    if (!id) return;

    const idPattern = /^[a-z0-9-]+$/;
    if (!idPattern.test(id)) {
      this.addError('INVALID_COMPONENT_ID', 'Component ID must be lowercase letters, numbers, and hyphens only');
    } else {
      this.addPassed('Component ID format valid');
    }

    if (id.length > 50) {
      this.addWarning('LONG_COMPONENT_ID', 'Component ID is quite long, consider shortening');
    }
  }

  validateDimensions(dimensions) {
    if (!dimensions) return;

    const dimensionPattern = /^\d+x\d+$/;
    if (!dimensionPattern.test(dimensions)) {
      this.addError('INVALID_DIMENSIONS', 'Dimensions must be in format WIDTHxHEIGHT (e.g., 300x600)');
    } else {
      this.addPassed('Dimensions format valid');
    }
  }

  validateVersion(version) {
    if (!version) return;

    const versionPattern = /^\d+\.\d+(\.\d+)?$/;
    if (!versionPattern.test(version)) {
      this.addError('INVALID_VERSION', 'Version must be in semantic versioning format (e.g., 1.0 or 1.0.0)');
    } else {
      this.addPassed('Version format valid');
    }
  }

  validateTaxonomy(taxonomy) {
    if (!taxonomy) return;

    const validVerticals = ['Auto Tier 1', 'CPG Food', 'Tech SaaS', 'Retail', 'Finance', 'Telecom'];
    const validAdTypes = ['Interactive Experience', 'Product Showcase', 'Video Showcase', 'Form Capture', 'Calculator Tool', 'Quiz Assessment'];
    const validInteractionLevels = ['simple', 'medium', 'high'];

    if (taxonomy.advertiserVertical && !validVerticals.includes(taxonomy.advertiserVertical)) {
      this.addError('INVALID_ADVERTISER_VERTICAL', `Invalid advertiser vertical: ${taxonomy.advertiserVertical}`);
    }

    if (taxonomy.adUnitType && !validAdTypes.includes(taxonomy.adUnitType)) {
      this.addError('INVALID_AD_UNIT_TYPE', `Invalid ad unit type: ${taxonomy.adUnitType}`);
    }

    if (taxonomy.interactionLevel && !validInteractionLevels.includes(taxonomy.interactionLevel)) {
      this.addError('INVALID_INTERACTION_LEVEL', `Invalid interaction level: ${taxonomy.interactionLevel}`);
    }
  }

  async validateComponentCode(componentCode, metadata) {
    console.log('  =» Validating component code...');

    // Check for class definition
    const className = metadata.webComponent?.className;
    if (className) {
      const classPattern = new RegExp(`class\\s+${className}\\s+extends`);
      if (!classPattern.test(componentCode)) {
        this.addError('MISSING_CLASS_DEFINITION', `Class ${className} not found or doesn't extend base class`);
      } else {
        this.addPassed(`Class ${className} found and extends base class`);
      }
    }

    // Check for custom element registration
    const tagName = metadata.webComponent?.tagName;
    if (tagName) {
      const registrationPattern = new RegExp(`customElements\\.define\\(\\s*['"\`]${tagName}['"\`]`);
      if (!registrationPattern.test(componentCode)) {
        this.addError('MISSING_CUSTOM_ELEMENT_REGISTRATION', `Custom element registration for ${tagName} not found`);
      } else {
        this.addPassed(`Custom element registration for ${tagName} found`);
      }
    }

    // Check for shadow DOM usage
    if (metadata.webComponent?.shadowDom) {
      if (!componentCode.includes('attachShadow')) {
        this.addError('MISSING_SHADOW_DOM', 'Component marked as using shadow DOM but attachShadow not found');
      } else {
        this.addPassed('Shadow DOM implementation found');
      }
    }

    // Check for required lifecycle methods
    const requiredMethods = ['connectedCallback'];
    for (const method of requiredMethods) {
      if (!componentCode.includes(method)) {
        this.addError('MISSING_LIFECYCLE_METHOD', `Required lifecycle method missing: ${method}`);
      } else {
        this.addPassed(`Lifecycle method found: ${method}`);
      }
    }

    // Check for event handling
    if (!componentCode.includes('addEventListener')) {
      this.addWarning('NO_EVENT_LISTENERS', 'No event listeners found - consider adding user interaction handling');
    }

    // Check for analytics tracking
    if (!componentCode.includes('handleUserInteraction') && !componentCode.includes('trackInteraction')) {
      this.addWarning('NO_ANALYTICS_TRACKING', 'No analytics tracking found - consider adding interaction tracking');
    }
  }

  async validateWebComponentStandards(componentCode, metadata) {
    console.log('  < Validating Web Component standards...');

    // Check for proper inheritance
    if (!componentCode.includes('extends HTMLElement') && !componentCode.includes('extends BaseAdUnit')) {
      this.addError('INVALID_INHERITANCE', 'Component must extend HTMLElement or BaseAdUnit');
    } else {
      this.addPassed('Component inheritance valid');
    }

    // Check for proper constructor
    if (!componentCode.includes('constructor()')) {
      this.addError('MISSING_CONSTRUCTOR', 'Component must have a constructor method');
    } else {
      this.addPassed('Constructor method found');
    }

    // Check for super() call in constructor
    if (componentCode.includes('constructor()') && !componentCode.includes('super()')) {
      this.addError('MISSING_SUPER_CALL', 'Constructor must call super()');
    } else if (componentCode.includes('constructor()')) {
      this.addPassed('Super call found in constructor');
    }

    // Check for closed shadow DOM mode
    if (componentCode.includes('attachShadow')) {
      if (componentCode.includes("mode: 'open'")) {
        this.addWarning('OPEN_SHADOW_DOM', 'Consider using closed shadow DOM for better encapsulation');
      } else if (componentCode.includes("mode: 'closed'")) {
        this.addPassed('Using closed shadow DOM for proper encapsulation');
      }
    }

    // Check for proper attribute handling
    if (componentCode.includes('observedAttributes')) {
      this.addPassed('Component observes attributes');
      
      if (!componentCode.includes('attributeChangedCallback')) {
        this.addError('MISSING_ATTRIBUTE_CALLBACK', 'observedAttributes defined but attributeChangedCallback missing');
      }
    }
  }

  async validatePerformance(componentPath, componentCode) {
    console.log('  ¡ Validating performance...');

    // Check file size
    const stats = fs.statSync(componentPath);
    const fileSizeKB = stats.size / 1024;

    if (fileSizeKB > this.validationRules.required.performance.maxBundleSize / 1024) {
      this.addError('FILE_TOO_LARGE', `Component file is ${fileSizeKB.toFixed(1)}KB, exceeds maximum of ${this.validationRules.required.performance.maxBundleSize / 1024}KB`);
    } else if (fileSizeKB > this.validationRules.recommended.performance.targetBundleSize / 1024) {
      this.addWarning('FILE_SIZE_WARNING', `Component file is ${fileSizeKB.toFixed(1)}KB, consider optimizing for target of ${this.validationRules.recommended.performance.targetBundleSize / 1024}KB`);
    } else {
      this.addPassed(`File size acceptable: ${fileSizeKB.toFixed(1)}KB`);
    }

    // Check for performance anti-patterns
    const performanceIssues = [
      { pattern: /document\.querySelector/g, message: 'Consider caching DOM queries' },
      { pattern: /setInterval/g, message: 'setInterval found - ensure proper cleanup' },
      { pattern: /setTimeout.*\d{4,}/g, message: 'Long timeout found - consider user experience' }
    ];

    for (const issue of performanceIssues) {
      const matches = componentCode.match(issue.pattern);
      if (matches && matches.length > 3) {
        this.addWarning('PERFORMANCE_ISSUE', `${issue.message} (${matches.length} occurrences)`);
      }
    }

    // Check for lazy loading patterns
    if (componentCode.includes('IntersectionObserver')) {
      this.addPassed('Uses IntersectionObserver for performance optimization');
    }

    // Check for memory management
    if (componentCode.includes('disconnectedCallback') && componentCode.includes('removeEventListener')) {
      this.addPassed('Proper cleanup in disconnectedCallback');
    } else if (componentCode.includes('addEventListener')) {
      this.addWarning('MEMORY_LEAK_RISK', 'Event listeners found but no cleanup in disconnectedCallback');
    }
  }

  async validateAccessibility(componentCode, metadata) {
    console.log('   Validating accessibility...');

    // Check for ARIA attributes
    const ariaPatterns = [
      'aria-label',
      'aria-describedby',
      'aria-expanded',
      'aria-hidden',
      'role='
    ];

    let ariaCount = 0;
    for (const pattern of ariaPatterns) {
      if (componentCode.includes(pattern)) {
        ariaCount++;
      }
    }

    if (ariaCount === 0) {
      this.addError('NO_ARIA_ATTRIBUTES', 'No ARIA attributes found - component may not be accessible');
    } else {
      this.addPassed(`ARIA attributes found: ${ariaCount} types`);
    }

    // Check for keyboard navigation
    if (componentCode.includes('keydown') || componentCode.includes('keyup')) {
      this.addPassed('Keyboard event handling found');
    } else {
      this.addWarning('NO_KEYBOARD_NAVIGATION', 'No keyboard event handling found');
    }

    // Check for focus management
    if (componentCode.includes('tabindex') || componentCode.includes('focus()')) {
      this.addPassed('Focus management found');
    } else {
      this.addWarning('NO_FOCUS_MANAGEMENT', 'No focus management found');
    }

    // Check for semantic HTML
    const semanticElements = ['button', 'input', 'label', 'form', 'h1', 'h2', 'h3', 'h4', 'nav'];
    let semanticCount = 0;
    
    for (const element of semanticElements) {
      if (componentCode.includes(`<${element}`)) {
        semanticCount++;
      }
    }

    if (semanticCount > 0) {
      this.addPassed(`Semantic HTML elements found: ${semanticCount}`);
    } else {
      this.addWarning('NO_SEMANTIC_HTML', 'No semantic HTML elements found - consider improving structure');
    }

    // Check for color contrast considerations
    if (componentCode.includes('prefers-color-scheme')) {
      this.addPassed('Dark mode support found');
    } else {
      this.addWarning('NO_DARK_MODE', 'No dark mode support found');
    }

    // Check for reduced motion support
    if (componentCode.includes('prefers-reduced-motion')) {
      this.addPassed('Reduced motion support found');
    } else {
      this.addWarning('NO_REDUCED_MOTION', 'No reduced motion support found');
    }
  }

  async validateSecurityCompliance(componentCode) {
    console.log('  = Validating security compliance...');

    // Check for dangerous patterns
    const securityIssues = [
      { pattern: /innerHTML\s*=.*\+/, message: 'Dynamic innerHTML concatenation detected - XSS risk' },
      { pattern: /eval\s*\(/, message: 'eval() usage detected - security risk' },
      { pattern: /Function\s*\(/, message: 'Function constructor usage detected - security risk' },
      { pattern: /document\.write/, message: 'document.write usage detected - avoid for security' },
      { pattern: /outerHTML\s*=/, message: 'outerHTML assignment detected - potential XSS risk' }
    ];

    for (const issue of securityIssues) {
      if (issue.pattern.test(componentCode)) {
        this.addError('SECURITY_ISSUE', issue.message);
      }
    }

    // Check for safe DOM manipulation
    if (componentCode.includes('textContent') || componentCode.includes('createElement')) {
      this.addPassed('Safe DOM manipulation methods found');
    }

    // Check for CSP compliance
    if (componentCode.includes('style.textContent') || componentCode.includes('appendChild')) {
      this.addPassed('CSP-compliant styling approach found');
    }

    // Check for external resource loading
    if (componentCode.includes('fetch(') || componentCode.includes('XMLHttpRequest')) {
      this.addWarning('EXTERNAL_REQUESTS', 'External network requests found - ensure proper error handling');
    }
  }

  async validateBrowserCompatibility(componentCode) {
    console.log('  < Validating browser compatibility...');

    // Check for modern JavaScript features that might need polyfills
    const modernFeatures = [
      { pattern: /async\s+function/, message: 'Async functions found - ensure browser support' },
      { pattern: /=>\s*{/, message: 'Arrow functions found - generally well supported' },
      { pattern: /`.*\$\{/, message: 'Template literals found - ensure browser support' },
      { pattern: /\.\.\.[a-zA-Z]/, message: 'Spread operator found - ensure browser support' },
      { pattern: /const\s+[a-zA-Z]/, message: 'Const declarations found - ensure browser support' }
    ];

    for (const feature of modernFeatures) {
      if (feature.pattern.test(componentCode)) {
        this.addPassed(feature.message);
      }
    }

    // Check for Web Components support
    if (componentCode.includes('customElements.define')) {
      this.addPassed('Using Custom Elements v1 API');
    }

    if (componentCode.includes('attachShadow')) {
      this.addPassed('Using Shadow DOM v1 API');
    }

    // Check for polyfill usage
    if (componentCode.includes('polyfill') || componentCode.includes('webcomponents')) {
      this.addPassed('Polyfill usage found for older browser support');
    }
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  addError(code, message) {
    this.errors.push({ code, message, type: 'error' });
  }

  addWarning(code, message) {
    this.warnings.push({ code, message, type: 'warning' });
  }

  addPassed(message) {
    this.passed.push({ message, type: 'passed' });
  }

  getResults() {
    const total = this.errors.length + this.warnings.length + this.passed.length;
    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;
    const passedCount = this.passed.length;

    return {
      valid: errorCount === 0,
      summary: {
        total,
        errors: errorCount,
        warnings: warningCount,
        passed: passedCount,
        score: total > 0 ? Math.round((passedCount / total) * 100) : 0
      },
      errors: this.errors,
      warnings: this.warnings,
      passed: this.passed
    };
  }

  printResults(results) {
    console.log('\n=Ê Validation Results:');
    console.log('');
    
    const { summary } = results;
    console.log(`Overall Score: ${summary.score}%`);
    console.log(` Passed: ${summary.passed}`);
    console.log(`   Warnings: ${summary.warnings}`);
    console.log(`L Errors: ${summary.errors}`);
    
    if (results.errors.length > 0) {
      console.log('\nL Errors:');
      results.errors.forEach(error => {
        console.log(`   " ${error.message}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n   Warnings:');
      results.warnings.forEach(warning => {
        console.log(`   " ${warning.message}`);
      });
    }
    
    if (results.valid) {
      console.log('\n<‰ Component validation passed!');
    } else {
      console.log('\n=¨ Component validation failed. Please fix errors before publishing.');
    }
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node component-validator.js <component-file> <metadata-file>');
    console.log('Example: node component-validator.js components/toyota-suv.js components/toyota-suv.json');
    process.exit(1);
  }

  const [componentPath, metadataPath] = args;
  const validator = new ComponentValidator();

  validator.validateComponent(componentPath, metadataPath)
    .then(results => {
      validator.printResults(results);
      process.exit(results.valid ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = ComponentValidator;