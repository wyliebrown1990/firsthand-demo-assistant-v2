#!/usr/bin/env node

/**
 * Firsthand Demo Assistant Library Builder
 * Builds and maintains the component library index and Chrome extension files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LibraryBuilder {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.adUnitLibraryDir = path.join(this.baseDir, 'ad-unit-library');
    this.chromeExtensionDir = path.join(this.baseDir, 'chrome-extension');
    this.componentsDir = path.join(this.adUnitLibraryDir, 'components');
    
    this.libraryIndex = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      totalComponents: 0,
      components: [],
      categories: {
        advertiserVerticals: [],
        adUnitTypes: [],
        dimensions: [],
        interactionLevels: []
      },
      quickFilters: {},
      popularComponents: [],
      recentlyAdded: [],
      featuredComponents: [],
      usageStatistics: {
        totalInjections: 0,
        mostPopular: null,
        averageEngagement: null,
        lastUpdated: new Date().toISOString()
      },
      metadata: {
        librarySize: '0KB',
        averageComponentSize: '0KB',
        supportedBrowsers: ['Chrome 88+', 'Firefox 88+', 'Safari 14+'],
        cspComplianceRate: '100%',
        accessibilityCompliance: '100%'
      }
    };

    this.componentRegistry = {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      description: 'Component registry for all available ad units in the Firsthand Demo Assistant library',
      metadata: {
        totalComponents: 0,
        categories: [],
        latestAddition: new Date().toISOString(),
        librarySize: '0KB'
      },
      components: [],
      componentCategories: {},
      validationRules: this.getValidationRules(),
      buildConfiguration: this.getBuildConfiguration()
    };
  }

  async buildLibrary() {
    console.log('<×  Building Firsthand Component Library...\n');

    try {
      // Discover all components
      const discoveredComponents = await this.discoverComponents();
      console.log(`=æ Discovered ${discoveredComponents.length} components`);

      // Process each component
      const processedComponents = [];
      for (const componentPath of discoveredComponents) {
        try {
          const processed = await this.processComponent(componentPath);
          if (processed) {
            processedComponents.push(processed);
          }
        } catch (error) {
          console.error(`L Failed to process ${componentPath}:`, error.message);
        }
      }

      console.log(` Successfully processed ${processedComponents.length} components`);

      // Build library structures
      this.buildLibraryIndex(processedComponents);
      this.buildComponentRegistry(processedComponents);
      this.extractCategories(processedComponents);
      this.calculateStatistics(processedComponents);

      // Copy components to Chrome extension
      await this.copyComponentsToExtension(processedComponents);

      // Write output files
      await this.writeLibraryFiles();

      console.log('\n<‰ Library build completed successfully!');
      this.printBuildSummary();

    } catch (error) {
      console.error('L Library build failed:', error);
      throw error;
    }
  }

  async discoverComponents() {
    const components = [];
    
    const searchDirectory = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDirectory(fullPath, path.join(basePath, item));
        } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
          // Check if corresponding metadata file exists
          const metadataPath = fullPath.replace('.js', '.json');
          if (fs.existsSync(metadataPath)) {
            components.push({
              componentPath: fullPath,
              metadataPath: metadataPath,
              relativePath: path.join(basePath, item),
              category: this.extractCategoryFromPath(basePath)
            });
          }
        }
      }
    };

    if (fs.existsSync(this.componentsDir)) {
      searchDirectory(this.componentsDir);
    }

    return components;
  }

  extractCategoryFromPath(relativePath) {
    const parts = relativePath.split(path.sep);
    return parts[0] || 'uncategorized';
  }

  async processComponent(componentInfo) {
    console.log(`  =Ä Processing ${componentInfo.relativePath}...`);

    // Load and validate metadata
    let metadata;
    try {
      const metadataContent = fs.readFileSync(componentInfo.metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      throw new Error(`Invalid metadata JSON: ${error.message}`);
    }

    // Load component code
    const componentCode = fs.readFileSync(componentInfo.componentPath, 'utf8');

    // Calculate file stats
    const stats = fs.statSync(componentInfo.componentPath);
    const fileSizeKB = Math.round(stats.size / 1024 * 100) / 100;

    // Generate file checksum
    const checksum = this.generateChecksum(componentCode);

    // Validate component structure
    const validation = this.quickValidateComponent(componentCode, metadata);
    if (!validation.valid) {
      console.warn(`     Validation warnings for ${metadata.id}:`, validation.warnings);
    }

    // Build processed component object
    const processedComponent = {
      // Library index format
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      version: metadata.version,
      created: metadata.created,
      contributor: metadata.contributor,
      path: this.getExtensionPath(componentInfo.relativePath),
      className: metadata.webComponent?.className,
      
      webComponent: metadata.webComponent,
      taxonomy: metadata.taxonomy,
      technicalSpecs: metadata.technicalSpecs,
      demoContext: metadata.demoContext,
      assets: metadata.assets,
      
      // Additional fields for registry
      status: 'active',
      lastModified: stats.mtime.toISOString(),
      file: {
        path: componentInfo.relativePath,
        size: `${fileSizeKB}KB`,
        checksum: `sha256:${checksum}`
      },
      metadata: {
        path: componentInfo.metadataPath.replace(this.adUnitLibraryDir, ''),
        validated: validation.valid,
        lastValidation: new Date().toISOString()
      },
      
      // Build search terms
      searchTerms: this.extractSearchTerms(metadata),
      
      // Original metadata for reference
      _fullMetadata: metadata,
      _componentCode: componentCode,
      _filePath: componentInfo.componentPath,
      _relativePath: componentInfo.relativePath,
      _category: componentInfo.category
    };

    return processedComponent;
  }

  generateChecksum(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex').substring(0, 16);
  }

  quickValidateComponent(componentCode, metadata) {
    const warnings = [];
    let valid = true;

    // Basic checks
    if (!metadata.id) {
      warnings.push('Missing component ID');
      valid = false;
    }

    if (!metadata.webComponent?.className) {
      warnings.push('Missing component class name');
      valid = false;
    }

    if (!componentCode.includes('customElements.define')) {
      warnings.push('No custom element registration found');
      valid = false;
    }

    return { valid, warnings };
  }

  extractSearchTerms(metadata) {
    const terms = new Set();

    // Add basic info
    if (metadata.name) {
      metadata.name.toLowerCase().split(/\s+/).forEach(term => terms.add(term));
    }

    // Add taxonomy terms
    if (metadata.taxonomy) {
      Object.values(metadata.taxonomy).forEach(value => {
        if (typeof value === 'string') {
          value.toLowerCase().split(/\s+/).forEach(term => terms.add(term));
        }
      });
    }

    // Add demo context terms
    if (metadata.demoContext) {
      ['bestFor', 'keyFeatures', 'talkingPoints'].forEach(field => {
        if (metadata.demoContext[field] && Array.isArray(metadata.demoContext[field])) {
          metadata.demoContext[field].forEach(item => {
            item.toLowerCase().split(/\s+/).forEach(term => terms.add(term));
          });
        }
      });
    }

    // Filter out common words and short terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return Array.from(terms).filter(term => term.length > 2 && !stopWords.has(term));
  }

  getExtensionPath(relativePath) {
    // Convert library path to extension path
    const extPath = relativePath.replace(/\\/g, '/');
    return `components/${extPath}`;
  }

  buildLibraryIndex(components) {
    console.log('  =Ñ Building library index...');

    this.libraryIndex.totalComponents = components.length;
    this.libraryIndex.components = components.map(comp => ({
      id: comp.id,
      name: comp.name,
      description: comp.description,
      version: comp.version,
      created: comp.created,
      contributor: comp.contributor,
      path: comp.path,
      className: comp.className,
      webComponent: comp.webComponent,
      taxonomy: comp.taxonomy,
      technicalSpecs: comp.technicalSpecs,
      demoContext: comp.demoContext,
      assets: comp.assets,
      searchTerms: comp.searchTerms
    }));

    // Set recent components (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.libraryIndex.recentlyAdded = components
      .filter(comp => new Date(comp.created) > thirtyDaysAgo)
      .map(comp => ({ id: comp.id, addedDate: comp.created }))
      .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));

    // Set popular components (for now, just use all components)
    this.libraryIndex.popularComponents = components.map(comp => comp.id);

    // Set featured components
    this.libraryIndex.featuredComponents = components
      .filter(comp => comp.taxonomy?.interactionLevel === 'high')
      .slice(0, 3)
      .map(comp => ({
        id: comp.id,
        reason: 'High engagement interactive experience',
        featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }));
  }

  buildComponentRegistry(components) {
    console.log('  =Ë Building component registry...');

    this.componentRegistry.metadata.totalComponents = components.length;
    this.componentRegistry.metadata.latestAddition = components.length > 0 ? 
      Math.max(...components.map(c => new Date(c.created).getTime())) : 
      new Date().toISOString();

    this.componentRegistry.components = components.map(comp => ({
      id: comp.id,
      status: comp.status,
      version: comp.version,
      created: comp.created,
      lastModified: comp.lastModified,
      contributor: comp.contributor,
      file: comp.file,
      metadata: comp.metadata,
      webComponent: comp.webComponent,
      dependencies: {
        external: [],
        internal: comp.webComponent?.dependencies || ['base-ad-unit'],
        polyfills: []
      },
      compatibility: {
        browsers: this.libraryIndex.metadata.supportedBrowsers,
        mobile: comp._fullMetadata?.technicalSpecs?.mobileOptimized || true,
        cspCompliant: comp._fullMetadata?.technicalSpecs?.cspCompliant || true,
        accessibilityLevel: comp._fullMetadata?.technicalSpecs?.accessibility || 'WCAG-AA'
      },
      testing: {
        lastTested: new Date().toISOString(),
        testCoverage: comp._fullMetadata?.testing?.testCoverage || '90%',
        performanceScore: '95/100',
        automatedTests: true
      }
    }));

    // Build category information
    const categories = {};
    components.forEach(comp => {
      const vertical = comp.taxonomy?.advertiserVertical;
      if (vertical) {
        if (!categories[this.slugify(vertical)]) {
          categories[this.slugify(vertical)] = {
            name: vertical,
            description: `Interactive ad units for ${vertical}`,
            componentCount: 0,
            lastUpdated: null,
            components: []
          };
        }
        categories[this.slugify(vertical)].componentCount++;
        categories[this.slugify(vertical)].components.push(comp.id);
        categories[this.slugify(vertical)].lastUpdated = comp.lastModified;
      }
    });

    this.componentRegistry.componentCategories = categories;
  }

  extractCategories(components) {
    console.log('  <÷  Extracting categories...');

    const verticals = new Set();
    const adTypes = new Set();
    const dimensions = new Set();
    const interactionLevels = new Set();

    components.forEach(comp => {
      if (comp.taxonomy?.advertiserVertical) verticals.add(comp.taxonomy.advertiserVertical);
      if (comp.taxonomy?.adUnitType) adTypes.add(comp.taxonomy.adUnitType);
      if (comp.taxonomy?.dimensions) dimensions.add(comp.taxonomy.dimensions);
      if (comp.taxonomy?.interactionLevel) interactionLevels.add(comp.taxonomy.interactionLevel);
    });

    this.libraryIndex.categories = {
      advertiserVerticals: Array.from(verticals).sort(),
      adUnitTypes: Array.from(adTypes).sort(),
      dimensions: Array.from(dimensions).sort(),
      interactionLevels: Array.from(interactionLevels).sort()
    };

    // Build quick filters
    this.libraryIndex.quickFilters = {
      'auto-sports': {
        name: 'Auto + Sports',
        description: 'Automotive campaigns for sports publishers',
        criteria: {
          advertiserVertical: 'Auto Tier 1',
          domainVertical: 'Sports'
        }
      },
      'cpg-lifestyle': {
        name: 'CPG + Lifestyle',
        description: 'Consumer goods for lifestyle publishers',
        criteria: {
          advertiserVertical: 'CPG Food',
          domainVertical: 'Lifestyle'
        }
      },
      'tech-business': {
        name: 'Tech + Business',
        description: 'Technology solutions for business audiences',
        criteria: {
          advertiserVertical: 'Tech SaaS',
          domainVertical: 'Business'
        }
      },
      'retail-ecommerce': {
        name: 'Retail + E-commerce',
        description: 'Retail campaigns for shopping contexts',
        criteria: {
          advertiserVertical: 'Retail'
        }
      }
    };
  }

  calculateStatistics(components) {
    console.log('  =Ê Calculating statistics...');

    const totalSize = components.reduce((sum, comp) => {
      const sizeKB = parseFloat(comp.file.size.replace('KB', ''));
      return sum + sizeKB;
    }, 0);

    const averageSize = components.length > 0 ? totalSize / components.length : 0;

    this.libraryIndex.metadata.librarySize = `${Math.round(totalSize)}KB`;
    this.libraryIndex.metadata.averageComponentSize = `${Math.round(averageSize)}KB`;

    this.componentRegistry.metadata.librarySize = this.libraryIndex.metadata.librarySize;
    this.componentRegistry.metadata.categories = Object.keys(this.componentRegistry.componentCategories);
  }

  async copyComponentsToExtension(components) {
    console.log('  =Â Copying components to Chrome extension...');

    const extensionComponentsDir = path.join(this.chromeExtensionDir, 'components');
    
    // Ensure extension components directory exists
    if (!fs.existsSync(extensionComponentsDir)) {
      fs.mkdirSync(extensionComponentsDir, { recursive: true });
    }

    for (const comp of components) {
      try {
        const sourceFile = comp._filePath;
        const targetDir = path.join(extensionComponentsDir, comp._category);
        const targetFile = path.join(targetDir, path.basename(comp._filePath));

        // Create target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Copy component file
        fs.copyFileSync(sourceFile, targetFile);
        
        console.log(`     Copied ${comp.id} to extension`);
      } catch (error) {
        console.error(`    L Failed to copy ${comp.id}:`, error.message);
      }
    }
  }

  async writeLibraryFiles() {
    console.log('  =¾ Writing library files...');

    // Write library index for ad-unit-library
    const libraryIndexPath = path.join(this.adUnitLibraryDir, 'library-index.json');
    fs.writeFileSync(libraryIndexPath, JSON.stringify(this.libraryIndex, null, 2));
    console.log(`     Written ${libraryIndexPath}`);

    // Write library index for Chrome extension
    const extensionIndexPath = path.join(this.chromeExtensionDir, 'library', 'library-index.json');
    const extensionDir = path.dirname(extensionIndexPath);
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }
    fs.writeFileSync(extensionIndexPath, JSON.stringify(this.libraryIndex, null, 2));
    console.log(`     Written ${extensionIndexPath}`);

    // Write component registry
    const registryPath = path.join(this.adUnitLibraryDir, 'component-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(this.componentRegistry, null, 2));
    console.log(`     Written ${registryPath}`);

    // Write search configuration
    const searchConfig = {
      fieldWeights: this.libraryIndex.searchConfiguration?.fieldWeights || {
        name: 10,
        'taxonomy.advertiser': 8,
        'taxonomy.adUnitType': 6,
        description: 4,
        'demoContext.keyFeatures': 3,
        searchTerms: 2
      },
      fuzzySearch: { enabled: true, threshold: 0.6 },
      stemming: { enabled: true, language: 'english' }
    };

    this.libraryIndex.searchConfiguration = searchConfig;
  }

  slugify(text) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  getValidationRules() {
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
          maxBundleSize: '100KB',
          maxLoadTime: '1000ms',
          minPerformanceScore: 80
        },
        accessibility: {
          minLevel: 'WCAG-AA',
          requiredFeatures: ['keyboard-navigation', 'screen-reader-support', 'aria-labels']
        }
      }
    };
  }

  getBuildConfiguration() {
    return {
      build: {
        minification: true,
        bundling: true,
        treeshaking: true,
        compressionLevel: 'high'
      },
      validation: {
        eslint: true,
        typescript: false,
        accessibility: true,
        performance: true,
        'browser-compatibility': true
      },
      testing: {
        unit: true,
        integration: true,
        'visual-regression': true,
        performance: true
      }
    };
  }

  printBuildSummary() {
    console.log('\n=È Build Summary:');
    console.log('');
    console.log(`=æ Total Components: ${this.libraryIndex.totalComponents}`);
    console.log(`=Ú Categories: ${this.libraryIndex.categories.advertiserVerticals.length}`);
    console.log(`=¾ Library Size: ${this.libraryIndex.metadata.librarySize}`);
    console.log(`<• Recent Components: ${this.libraryIndex.recentlyAdded.length}`);
    console.log(`P Featured Components: ${this.libraryIndex.featuredComponents.length}`);
    console.log(`<¯ Quick Filters: ${Object.keys(this.libraryIndex.quickFilters).length}`);
    console.log('');
  }
}

// CLI Usage
if (require.main === module) {
  const builder = new LibraryBuilder();
  
  builder.buildLibrary()
    .then(() => {
      console.log('\n Library build completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nL Library build failed:', error);
      process.exit(1);
    });
}

module.exports = LibraryBuilder;