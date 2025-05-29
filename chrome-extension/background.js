chrome.runtime.onInstalled.addListener(() => {
  console.log('Firsthand Demo Assistant v2.0 installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data, source } = message;

  switch (action) {
    case 'track-interaction':
      handleTrackInteraction(data, sender);
      sendResponse({ success: true });
      break;

    case 'csp-violation':
      handleCSPViolation(data, sender);
      sendResponse({ success: true });
      break;

    case 'get-tab-info':
      handleGetTabInfo(sender, sendResponse);
      return true;

    case 'store-demo-data':
      handleStoreDemoData(data, sendResponse);
      return true;

    case 'get-demo-data':
      handleGetDemoData(data, sendResponse);
      return true;

    default:
      sendResponse({ error: `Unknown action: ${action}` });
  }
});

function handleTrackInteraction(data, sender) {
  const interactionData = {
    ...data,
    tabId: sender.tab?.id,
    url: sender.tab?.url,
    timestamp: Date.now()
  };

  chrome.storage.local.get(['interactions'], (result) => {
    const interactions = result.interactions || [];
    interactions.push(interactionData);
    
    if (interactions.length > 1000) {
      interactions.splice(0, interactions.length - 1000);
    }

    chrome.storage.local.set({ interactions });
  });

  console.log('Ad interaction tracked:', interactionData);
}

function handleCSPViolation(data, sender) {
  const violationData = {
    ...data,
    tabId: sender.tab?.id,
    url: sender.tab?.url,
    timestamp: Date.now()
  };

  chrome.storage.local.get(['cspViolations'], (result) => {
    const violations = result.cspViolations || [];
    violations.push(violationData);
    
    if (violations.length > 100) {
      violations.splice(0, violations.length - 100);
    }

    chrome.storage.local.set({ cspViolations: violations });
  });

  console.warn('CSP violation reported:', violationData);
}

function handleGetTabInfo(sender, sendResponse) {
  if (sender.tab) {
    sendResponse({
      success: true,
      tabInfo: {
        id: sender.tab.id,
        url: sender.tab.url,
        title: sender.tab.title,
        favicon: sender.tab.favIconUrl
      }
    });
  } else {
    sendResponse({
      success: false,
      error: 'Tab information not available'
    });
  }
}

function handleStoreDemoData(data, sendResponse) {
  const { key, value } = data;
  
  chrome.storage.local.set({ [key]: value }, () => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
    } else {
      sendResponse({ success: true });
    }
  });
}

function handleGetDemoData(data, sendResponse) {
  const { key } = data;
  
  chrome.storage.local.get([key], (result) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
    } else {
      sendResponse({
        success: true,
        value: result[key]
      });
    }
  });
}

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('Storage changes:', changes);
  }
});