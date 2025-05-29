/**
 * Test Leaderboard Banner Component (728x90)
 * Demonstrates horizontal banner format
 */

import BaseAdUnit from '../base/base-ad-unit.js';

class TestLeaderboard extends BaseAdUnit {
  constructor() {
    super();
    // Component will be rendered via Shadow DOM Injector
  }
}

// Safe custom element registration
if (typeof customElements !== 'undefined' && customElements) {
  customElements.define('test-leaderboard', TestLeaderboard);
}

// Global export
if (typeof window !== 'undefined') {
  window.TestLeaderboard = TestLeaderboard;
}

export default TestLeaderboard;