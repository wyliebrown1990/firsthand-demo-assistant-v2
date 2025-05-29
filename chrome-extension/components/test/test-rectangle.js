/**
 * Test Medium Rectangle Component (300x250)
 * Demonstrates medium rectangle format
 */

import BaseAdUnit from '../base/base-ad-unit.js';

class TestRectangle extends BaseAdUnit {
  constructor() {
    super();
    // Component will be rendered via Shadow DOM Injector
  }
}

// Safe custom element registration
if (typeof customElements !== 'undefined' && customElements) {
  customElements.define('test-rectangle', TestRectangle);
}

// Global export
if (typeof window !== 'undefined') {
  window.TestRectangle = TestRectangle;
}

export default TestRectangle;