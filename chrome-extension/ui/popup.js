class FirsthandPopup {
  constructor() {
    this.currentTab = null;
    this.selectedComponent = null;
    this.libraryData = null;
    this.searchResults = [];
    this.injectedComponents = [];
    this.isAdvancedMode = false;
    
    this.init();
  }

  async init() {
    try {
      console.log('Initializing popup...');
      await this.setupUI();
      console.log('UI setup complete');
      await this.getCurrentTab();
      console.log('Current tab retrieved');
      await this.checkConnectionStatus();
      console.log('Connection status checked');
      await this.loadLibraryData();
      console.log('Library data loaded');
      await this.loadInjectedComponents();
      console.log('Injected components loaded');
      this.setupEventListeners();
      console.log('Event listeners setup');
      this.switchTab('select'); // Initialize with Select Component tab
      console.log('Default tab set');
      this.setStatus('ready', 'Ready');
      console.log('Popup initialization complete');
    } catch (error) {
      console.error('Popup initialization failed:', error);
      this.setStatus('error', 'Initialization failed');
      this.showMessage('Failed to initialize popup: ' + error.message, 'error');
    }
  }

  setupUI() {
    console.log('Setting up UI elements...');
    this.elements = {
      // Tab navigation
      selectTab: document.getElementById('selectTab'),
      deployTab: document.getElementById('deployTab'),
      selectSection: document.getElementById('selectSection'),
      deploySection: document.getElementById('deploySection'),
      
      // Search and filters
      componentSearch: document.getElementById('componentSearch'),
      searchBtn: document.getElementById('searchBtn'),
      advertiserVerticalFilter: document.getElementById('advertiserVerticalFilter'),
      adUnitTypeFilter: document.getElementById('adUnitTypeFilter'),
      dimensionsFilter: document.getElementById('dimensionsFilter'),
      quickFilters: document.querySelectorAll('.quick-filter'),
      clearFilters: document.getElementById('clearFilters'),
      
      // Component grid
      componentGrid: document.getElementById('componentGrid'),
      resultsCount: document.getElementById('resultsCount'),
      
      // Selected component (in Select tab)
      selectedComponent: document.getElementById('selectedComponent'),
      selectedName: document.getElementById('selectedName'),
      selectedDescription: document.getElementById('selectedDescription'),
      selectedVertical: document.getElementById('selectedVertical'),
      selectedType: document.getElementById('selectedType'),
      selectedDimensions: document.getElementById('selectedDimensions'),
      clearSelection: document.getElementById('clearSelection'),
      
      // Deploy tab elements
      deployComponentInfo: document.getElementById('deployComponentInfo'),
      deployComponentName: document.getElementById('deployComponentName'),
      deployComponentMeta: document.getElementById('deployComponentMeta'),
      noSelectionState: document.getElementById('noSelectionState'),
      deploymentForm: document.getElementById('deploymentForm'),
      goToSelectTab: document.getElementById('goToSelectTab'),
      
      // Injection controls
      targetSelector: document.getElementById('targetSelector'),
      detectTargets: document.getElementById('detectTargets'),
      validateTarget: document.getElementById('validateTarget'),
      targetValidation: document.getElementById('targetValidation'),
      targetSuggestions: document.getElementById('targetSuggestions'),
      insertMethod: document.getElementById('insertMethod'),
      injectComponent: document.getElementById('injectComponent'),
      toggleAdvanced: document.getElementById('toggleAdvanced'),
      advancedOptions: document.getElementById('advancedOptions'),
      componentData: document.getElementById('componentData'),
      
      // Injected components
      injectedList: document.getElementById('injectedList'),
      refreshInjected: document.getElementById('refreshInjected'),
      clearAllComponents: document.getElementById('clearAllComponents'),
      
      // Status and modals
      statusMessage: document.getElementById('statusMessage'),
      connectionStatus: document.getElementById('connectionStatus'),
      statusText: document.getElementById('statusText'),
      componentModal: document.getElementById('componentModal'),
      helpModal: document.getElementById('helpModal'),
      
      // Footer actions
      debugMode: document.getElementById('debugMode'),
      helpBtn: document.getElementById('helpBtn'),
      settingsBtn: document.getElementById('settingsBtn')
    };
    
    // Validate that critical elements exist
    const criticalElements = ['selectTab', 'deployTab', 'componentGrid', 'injectComponent', 'statusMessage', 'goToSelectTab'];
    for (const elementName of criticalElements) {
      if (!this.elements[elementName]) {
        throw new Error(`Critical UI element not found: ${elementName}`);
      }
    }
    
    console.log('All UI elements found successfully');
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
  }

  async checkConnectionStatus() {
    try {
      const response = await this.sendMessageToTab({ action: 'ping' });
      if (response && response.status === 'ready') {
        this.setStatus('ready', 'Connected');
      } else {
        this.setStatus('error', 'Content script not ready');
      }
    } catch (error) {
      this.setStatus('error', 'Connection failed');
    }
  }

  async loadLibraryData() {
    try {
      const response = await this.sendMessageToTab({ action: 'get-library-data' });
      if (response && response.success) {
        this.libraryData = response;
        this.populateFilters();
        this.performSearch(); // Load all components initially
      }
    } catch (error) {
      console.error('Failed to load library data:', error);
      this.showMessage('Failed to load component library', 'error');
    }
  }

  async loadInjectedComponents() {
    try {
      const response = await this.sendMessageToTab({ action: 'get-injected-components' });
      if (response && response.success) {
        this.injectedComponents = response.components;
        this.updateInjectedList();
      }
    } catch (error) {
      console.error('Failed to load injected components:', error);
    }
  }

  populateFilters() {
    if (!this.libraryData) return;

    // Populate vertical filter
    this.libraryData.verticals.forEach(vertical => {
      const option = document.createElement('option');
      option.value = vertical;
      option.textContent = vertical;
      this.elements.advertiserVerticalFilter.appendChild(option);
    });

    // Populate ad type filter
    this.libraryData.adTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      this.elements.adUnitTypeFilter.appendChild(option);
    });

    // Populate dimensions filter
    this.libraryData.dimensions.forEach(dimension => {
      const option = document.createElement('option');
      option.value = dimension;
      option.textContent = dimension;
      this.elements.dimensionsFilter.appendChild(option);
    });
  }

  setupEventListeners() {
    // Tab navigation
    this.elements.selectTab.addEventListener('click', () => this.switchTab('select'));
    this.elements.deployTab.addEventListener('click', () => this.switchTab('deploy'));

    // Search and filters
    this.elements.componentSearch.addEventListener('input', () => this.performSearch());
    this.elements.searchBtn.addEventListener('click', () => this.performSearch());
    this.elements.advertiserVerticalFilter.addEventListener('change', () => this.performSearch());
    this.elements.adUnitTypeFilter.addEventListener('change', () => this.performSearch());
    this.elements.dimensionsFilter.addEventListener('change', () => this.performSearch());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());

    // Quick filters
    this.elements.quickFilters.forEach(filter => {
      filter.addEventListener('click', () => this.applyQuickFilter(filter.dataset.filter));
    });


    // Target validation and detection
    this.elements.validateTarget.addEventListener('click', () => this.validateTargetSelector());
    this.elements.detectTargets.addEventListener('click', () => this.detectTargetElements());
    this.elements.targetSelector.addEventListener('input', () => this.clearTargetValidation());

    // Injection controls
    this.elements.injectComponent.addEventListener('click', () => this.injectSelectedComponent());
    this.elements.clearSelection.addEventListener('click', () => this.clearComponentSelection());
    this.elements.goToSelectTab.addEventListener('click', () => this.switchTab('select'));

    // Injected components management
    this.elements.refreshInjected.addEventListener('click', () => this.loadInjectedComponents());
    this.elements.clearAllComponents.addEventListener('click', () => this.clearAllComponents());

    // Footer actions
    this.elements.debugMode.addEventListener('click', () => this.toggleDebugMode());
    this.elements.helpBtn.addEventListener('click', () => this.showHelpModal());

    // Modal handling
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target);
      }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.closeModal(e.target.closest('.modal'));
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
          this.closeModal(openModal);
        }
      }
    });
  }

  switchTab(tab) {
    // Update tab buttons
    this.elements.selectTab.classList.toggle('active', tab === 'select');
    this.elements.deployTab.classList.toggle('active', tab === 'deploy');
    
    // Update tab content visibility
    this.elements.selectSection.classList.toggle('active', tab === 'select');
    this.elements.deploySection.classList.toggle('active', tab === 'deploy');
  }

  async performSearch() {
    const query = this.elements.componentSearch.value.trim();
    const filters = {
      advertiserVertical: this.elements.advertiserVerticalFilter.value,
      adUnitType: this.elements.adUnitTypeFilter.value,
      dimensions: this.elements.dimensionsFilter.value
    };

    try {
      const response = await this.sendMessageToTab({
        action: 'search-components',
        data: { query, filters }
      });

      if (response && response.success) {
        this.searchResults = response.results;
        this.updateComponentGrid();
        this.updateResultsCount();
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.showMessage('Search failed', 'error');
    }
  }

  updateComponentGrid() {
    const grid = this.elements.componentGrid;
    
    if (this.searchResults.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No components found matching your criteria</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.searchResults.map(component => `
      <div class="component-card" data-component-id="${component.id}">
        <div class="component-name">${component.name}</div>
        <div class="component-description">${component.description}</div>
        <div class="component-meta">
          <span class="meta-tag vertical">${component.taxonomy?.advertiserVertical || 'Unknown'}</span>
          <span class="meta-tag type">${component.taxonomy?.adUnitType || 'Unknown'}</span>
          <span class="meta-tag dimensions">${component.taxonomy?.dimensions || 'Unknown'}</span>
        </div>
      </div>
    `).join('');

    // Add click handlers to component cards
    grid.querySelectorAll('.component-card').forEach(card => {
      card.addEventListener('click', () => {
        const componentId = card.dataset.componentId;
        const component = this.searchResults.find(c => c.id === componentId);
        this.selectComponent(component);
      });
    });
  }

  updateResultsCount() {
    const count = this.searchResults.length;
    this.elements.resultsCount.textContent = `${count} component${count !== 1 ? 's' : ''} found`;
  }

  selectComponent(component) {
    this.selectedComponent = component;
    this.updateSelectedComponentDisplay();
    this.updateInjectButtonState();

    // Update grid selection
    this.elements.componentGrid.querySelectorAll('.component-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const selectedCard = this.elements.componentGrid.querySelector(`[data-component-id="${component.id}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }

    // Switch to Deploy tab when component is selected
    this.switchTab('deploy');
  }

  updateSelectedComponentDisplay() {
    if (!this.selectedComponent) {
      // Hide selection displays in both tabs
      this.elements.selectedComponent.style.display = 'none';
      this.elements.deployComponentInfo.style.display = 'none';
      this.elements.noSelectionState.style.display = 'block';
      this.elements.deploymentForm.style.display = 'none';
      return;
    }

    // Update Select tab display
    this.elements.selectedComponent.style.display = 'block';
    this.elements.selectedName.textContent = this.selectedComponent.name;
    this.elements.selectedDescription.textContent = this.selectedComponent.description;
    
    const taxonomy = this.selectedComponent.taxonomy || {};
    this.elements.selectedVertical.textContent = taxonomy.advertiserVertical || 'Unknown';
    this.elements.selectedType.textContent = taxonomy.adUnitType || 'Unknown';
    this.elements.selectedDimensions.textContent = taxonomy.dimensions || 'Unknown';

    // Update Deploy tab display
    this.elements.deployComponentInfo.style.display = 'block';
    this.elements.noSelectionState.style.display = 'none';
    this.elements.deploymentForm.style.display = 'block';
    this.elements.deployComponentName.textContent = this.selectedComponent.name;
    this.elements.deployComponentMeta.innerHTML = `
      <span class="meta-tag vertical">${taxonomy.advertiserVertical || 'Unknown'}</span>
      <span class="meta-tag type">${taxonomy.adUnitType || 'Unknown'}</span>
      <span class="meta-tag dimensions">${taxonomy.dimensions || 'Unknown'}</span>
    `;
  }

  clearComponentSelection() {
    this.selectedComponent = null;
    this.updateSelectedComponentDisplay();
    this.updateInjectButtonState();
    
    this.elements.componentGrid.querySelectorAll('.component-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Switch back to Select tab when selection is cleared
    this.switchTab('select');
  }


  async validateTargetSelector() {
    const selector = this.elements.targetSelector.value.trim();
    if (!selector) {
      this.showTargetValidation('Please enter a selector', 'invalid');
      return;
    }

    try {
      const response = await this.sendMessageToTab({
        action: 'validate-target',
        data: { targetSelector: selector }
      });

      if (response && response.success) {
        const validation = response.validation;
        if (validation.valid) {
          this.showTargetValidation(
            ` Valid element found (${validation.tagName}, ${validation.dimensions?.width}x${validation.dimensions?.height}px)`,
            'valid'
          );
          this.updateInjectButtonState();
        } else {
          this.showTargetValidation(` Element not found: ${selector}`, 'invalid');
        }
      }
    } catch (error) {
      console.error('Target validation failed:', error);
      this.showTargetValidation('Validation failed', 'invalid');
    }
  }

  showTargetValidation(message, type) {
    this.elements.targetValidation.textContent = message;
    this.elements.targetValidation.className = `validation-message ${type}`;
    this.elements.targetValidation.style.display = 'block';
  }

  clearTargetValidation() {
    this.elements.targetValidation.style.display = 'none';
    this.updateInjectButtonState();
  }

  async detectTargetElements() {
    this.showMessage('Detecting potential target elements...', 'info');
    
    // This would call the content script to detect ad slots
    // For now, show common selectors
    const commonSelectors = [
      '#sidebar',
      '.sidebar',
      '.ad-slot',
      '.advertisement',
      '.widget-area',
      '[class*="ad"]',
      '[class*="banner"]'
    ];

    this.showTargetSuggestions(commonSelectors);
  }

  showTargetSuggestions(selectors) {
    const suggestionsDiv = this.elements.targetSuggestions;
    const listDiv = suggestionsDiv.querySelector('.suggestions-list');
    
    listDiv.innerHTML = selectors.map(selector => 
      `<span class="suggestion-item" data-selector="${selector}">${selector}</span>`
    ).join('');

    listDiv.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        this.elements.targetSelector.value = item.dataset.selector;
        this.validateTargetSelector();
        suggestionsDiv.style.display = 'none';
      });
    });

    suggestionsDiv.style.display = 'block';
  }

  updateInjectButtonState() {
    const hasComponent = !!this.selectedComponent;
    const hasTarget = this.elements.targetSelector.value.trim().length > 0;
    
    this.elements.injectComponent.disabled = !(hasComponent && hasTarget);
  }

  async injectSelectedComponent() {
    if (!this.selectedComponent || !this.elements.targetSelector.value.trim()) {
      this.showMessage('Please select a component and target element', 'warning');
      return;
    }

    const injectionData = {
      componentId: this.selectedComponent.id,
      targetSelector: this.elements.targetSelector.value.trim(),
      insertMethod: this.elements.insertMethod.value,
      config: {}
    };


    this.setStatus('injecting', 'Injecting component...');

    try {
      const response = await this.sendMessageToTab({
        action: 'inject-component',
        data: injectionData
      });

      if (response && response.success) {
        this.showMessage(
          `Successfully injected ${this.selectedComponent.name}`,
          'success'
        );
        await this.loadInjectedComponents();
        this.setStatus('ready', 'Ready');
      } else {
        this.showMessage(
          `Injection failed: ${response?.error || 'Unknown error'}`,
          'error'
        );
        this.setStatus('ready', 'Ready');
      }
    } catch (error) {
      console.error('Injection failed:', error);
      this.showMessage('Injection failed', 'error');
      this.setStatus('ready', 'Ready');
    }
  }

  toggleAdvancedOptions() {
    this.isAdvancedMode = !this.isAdvancedMode;
    this.elements.advancedOptions.style.display = this.isAdvancedMode ? 'block' : 'none';
    this.elements.toggleAdvanced.textContent = this.isAdvancedMode ? '== Basic' : '� Advanced';
  }

  updateInjectedList() {
    const list = this.elements.injectedList;
    
    if (this.injectedComponents.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>No components injected yet</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.injectedComponents.map(component => `
      <div class="injected-item">
        <div class="injected-info">
          <div class="injected-name">${component.componentClass}</div>
          <div class="injected-target">${component.targetSelector}</div>
        </div>
        <button class="remove-btn" data-component-id="${component.id}">Remove</button>
      </div>
    `).join('');

    // Add remove handlers
    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeComponent(btn.dataset.componentId);
      });
    });
  }

  async removeComponent(componentId) {
    try {
      const response = await this.sendMessageToTab({
        action: 'remove-component',
        data: { componentId }
      });

      if (response && response.success) {
        this.showMessage('Component removed', 'success');
        await this.loadInjectedComponents();
      } else {
        this.showMessage('Failed to remove component', 'error');
      }
    } catch (error) {
      console.error('Component removal failed:', error);
      this.showMessage('Removal failed', 'error');
    }
  }

  async clearAllComponents() {
    if (this.injectedComponents.length === 0) {
      this.showMessage('No components to clear', 'info');
      return;
    }

    if (!confirm('Remove all injected components?')) {
      return;
    }

    try {
      const response = await this.sendMessageToTab({
        action: 'remove-all-components'
      });

      if (response && response.success) {
        this.showMessage('All components cleared', 'success');
        await this.loadInjectedComponents();
      } else {
        this.showMessage('Failed to clear components', 'error');
      }
    } catch (error) {
      console.error('Clear all failed:', error);
      this.showMessage('Clear operation failed', 'error');
    }
  }

  exportComponentList() {
    const data = {
      url: this.currentTab?.url,
      timestamp: new Date().toISOString(),
      injectedComponents: this.injectedComponents
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `firsthand-components-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showMessage('Component list exported', 'success');
  }

  clearFilters() {
    this.elements.componentSearch.value = '';
    this.elements.advertiserVerticalFilter.value = '';
    this.elements.adUnitTypeFilter.value = '';
    this.elements.dimensionsFilter.value = '';
    
    this.elements.quickFilters.forEach(filter => {
      filter.classList.remove('active');
    });

    this.performSearch();
  }

  applyQuickFilter(filterType) {
    // Clear existing filters first
    this.clearFilters();

    // Apply quick filter logic based on filterType
    const filterMappings = {
      'auto-sports': { advertiserVertical: 'Auto Tier 1' },
      'cpg-lifestyle': { advertiserVertical: 'CPG Food' },
      'tech-business': { advertiserVertical: 'Tech SaaS' },
      'retail-ecommerce': { advertiserVertical: 'Retail' }
    };

    const mapping = filterMappings[filterType];
    if (mapping) {
      if (mapping.advertiserVertical) {
        this.elements.advertiserVerticalFilter.value = mapping.advertiserVertical;
      }
    }

    // Update UI
    this.elements.quickFilters.forEach(filter => {
      filter.classList.toggle('active', filter.dataset.filter === filterType);
    });

    this.performSearch();
  }

  async toggleDebugMode() {
    try {
      await this.sendMessageToTab({
        action: 'toggle-debug'
      });
      this.showMessage('Debug mode toggled', 'info');
    } catch (error) {
      console.error('Debug toggle failed:', error);
    }
  }

  showHelpModal() {
    this.elements.helpModal.style.display = 'flex';
  }

  closeModal(modal) {
    if (modal) {
      modal.style.display = 'none';
    }
  }

  showMessage(message, type = 'info') {
    const statusEl = this.elements.statusMessage;
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  setStatus(status, text) {
    this.elements.connectionStatus.className = `status-dot ${status}`;
    this.elements.statusText.textContent = text;
  }

  async sendMessageToTab(message) {
    if (!this.currentTab) {
      throw new Error('No active tab');
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FirsthandPopup();
});