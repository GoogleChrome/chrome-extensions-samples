// Copyright 2024 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for tab updates to demonstrate tab-specific side panels
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

// Example: Set different side panel for specific URLs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    // You can set tab-specific side panels based on URL
    if (tab.url && tab.url.includes('github.com')) {
      // Could set a GitHub-specific side panel here
      console.log('GitHub tab activated');
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Handle messages from side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ windowId: message.windowId });
    sendResponse({ success: true });
    return true;
  }
});

// Log when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Side Panel extension installed');
});
