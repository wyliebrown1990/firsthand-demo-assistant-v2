# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Firsthand Demo Assistant v2.0 is a Chrome extension platform for reliable ad unit demonstrations using Shadow DOM isolation. It solves the "70% demonstration failure rate" problem by providing guaranteed injection success across publisher websites through complete CSS/JS isolation.

## Core Architecture

### Chrome Extension Structure
- **Manifest v3** with content scripts and service worker architecture
- **Shadow DOM v1** with closed mode for complete isolation from host page styles/scripts
- **CSP bypass** through Shadow DOM encapsulation avoiding traditional injection failures

### Component System
- **BaseAdUnit**: Core web component class with lifecycle management, state handling, and event delegation
- **Component Library**: Hierarchical organization by advertiser verticals (Auto Tier 1, CPG Food, Tech SaaS, Retail)
- **Metadata Schema**: Rich taxonomy including technical specs, demo context, and search optimization

### Key Technical Patterns
- **Shadow DOM Injector**: Core injection system that creates wrapper divs and manually renders component content to avoid HTMLElement constructor issues in Chrome extensions
- **Component Manager**: Handles dynamic loading, validation, and lifecycle management of ad components
- **Message Handler**: Facilitates communication between popup UI and content scripts

## Development Commands

### Component Development
```bash
# Validate all components in the library
node tools/component-validator.js

# Build and update library index
node tools/library-builder.js

# Test component in isolation
# Load test-toyota-component.html in browser after loading extension
```

### Chrome Extension Development
- Load unpacked extension from `chrome-extension/` directory in Chrome Developer Mode
- Reload extension after code changes to `chrome-extension/` files
- Use browser DevTools to debug content scripts and popup

## Component Creation Workflow

1. **Extend BaseAdUnit**: All components must extend the BaseAdUnit class
2. **Use Template**: Start from `ad-unit-library/templates/web-component-template.js`
3. **Add Metadata**: Create corresponding JSON file with taxonomy and demo context
4. **Update Library**: Run library builder to regenerate search index
5. **Validate**: Use component validator to ensure compliance

### Critical Implementation Details

**Component Instantiation**: Components cannot use `new ComponentClass()` due to HTMLElement constructor restrictions in Chrome extensions. The Shadow DOM Injector creates wrapper divs and manually renders content using the `initializeComponentContent` method.

**Import Strategy**: Use ES6 module imports with relative paths. BaseAdUnit must be imported as `import BaseAdUnit from '../base/base-ad-unit.js'` in components.

**Custom Element Registration**: Protected with availability checks:
```javascript
if (typeof customElements !== 'undefined' && customElements) {
  customElements.define('component-name', ComponentClass);
}
```

## File Organization

### Library Structure
- `ad-unit-library/`: Master component library with metadata and templates
- `chrome-extension/components/`: Actual component implementations
- `chrome-extension/library/`: Runtime library index (copied from ad-unit-library)

### Core Extension Files
- `core/shadow-dom-injector.js`: Main injection system
- `core/component-manager.js`: Component loading and lifecycle
- `core/message-handler.js`: Communication between popup and content
- `ui/popup.js`: Component search and injection interface

## State Management

Components use a standardized state object with step-based progression:
```javascript
this.state = {
  currentStep: 'initial',
  selectedOptions: {},
  userData: {},
  isLoading: false
}
```

Event handling through BaseAdUnit's `handleClick` method with automatic cleanup.

## Search and Discovery

**Weighted Search**: Search engine uses field weights (name: 10, advertiser: 8, adUnitType: 6) with fuzzy matching and stemming.

**Taxonomy Filtering**: Components tagged with advertiser verticals, publisher contexts, ad unit types, and interaction levels for precise discovery.

**Quick Filters**: Pre-configured filter combinations like "Auto + Sports" for common demo scenarios.

## Testing Strategy

Use `test-toyota-component.html` as template for component testing. Provides Sports Illustrated-style content with multiple injection targets (#sidebar, #ad-placement, .ad-slot) and test controls.

## Dimensional Flexibility

**Template-Based Dimensions**: Components automatically adapt to any specified dimensions through the metadata `taxonomy.dimensions` field (e.g., "728x90", "300x250", "320x50").

**Supported Standard Formats**:
- Leaderboard: 728×90px
- Wide Skyscraper: 300×600px  
- Medium Rectangle: 300×250px
- Large Rectangle: 336×280px
- Skyscraper: 160×600px
- Mobile Banner: 320×50px
- Billboard: 970×250px

**Implementation**: The Shadow DOM Injector automatically parses dimensions from metadata and applies responsive scaling to fonts, padding, and layout elements.

## Key Constraints

- All components must work in Shadow DOM isolation
- No external dependencies unless pre-loaded
- WCAG-AA accessibility compliance required
- CSP compliance through Shadow DOM encapsulation
- Component dimensions defined in metadata taxonomy
- Responsive design within specified dimensions mandatory