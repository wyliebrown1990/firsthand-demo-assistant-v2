/**
 * Test Mobile Banner Component (320x50)
 * Demonstrates mobile banner format
 */

import BaseAdUnit from '../base/base-ad-unit.js';

class TestMobile extends BaseAdUnit {
  constructor() {
    super();
    // Component will be rendered via Shadow DOM Injector
  }
}

// Safe custom element registration
if (typeof customElements !== 'undefined' && customElements) {
  customElements.define('test-mobile', TestMobile);
}

// Global export
if (typeof window !== 'undefined') {
  window.TestMobile = TestMobile;
}

export default TestMobile;