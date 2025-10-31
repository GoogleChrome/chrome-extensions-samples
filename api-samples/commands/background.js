// Copyright 2024 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Track feature state
let featureEnabled = false;

// Listen for command shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  console.log(`Command triggered: ${command}`);

  switch (command) {
    case 'toggle-feature':
      await handleToggleFeature();
      break;
    
    case 'take-screenshot':
      await handleTakeScreenshot();
      break;
    
    case 'show-notification':
      await handleShowNotification();
      break;
    
    case 'command-without-shortcut':
      console.log('Command without shortcut was triggered');
      showNotification('Command Triggered', 'This command has no default shortcut');
      break;
    
    default:
      console.log('Unknown command:', command);
  }
});

// Handle toggle feature command
async function handleToggleFeature() {
  featureEnabled = !featureEnabled;
  
  // Save state to storage
  await chrome.storage.local.set({ featureEnabled });
  
  const status = featureEnabled ? 'enabled' : 'disabled';
  console.log(`Feature ${status}`);
  
  showNotification(
    'Feature Toggled',
    `Feature is now ${status}`,
    featureEnabled ? 'success' : 'info'
  );
}

// Handle take screenshot command
async function handleTakeScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showNotification('Screenshot Failed', 'No active tab found', 'error');
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    // Create a download for the screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await chrome.downloads.download({
      url: dataUrl,
      filename: `screenshot-${timestamp}.png`,
      saveAs: false
    });
    
    showNotification(
      'Screenshot Captured',
      `Screenshot of "${tab.title}" saved`,
      'success'
    );
  } catch (error) {
    console.error('Screenshot error:', error);
    showNotification('Screenshot Failed', error.message, 'error');
  }
}

// Handle show notification command
async function handleShowNotification() {
  const timestamp = new Date().toLocaleTimeString();
  showNotification(
    'Keyboard Shortcut Triggered',
    `This notification was triggered at ${timestamp}`,
    'info'
  );
}

// Show a notification
function showNotification(title, message, type = 'info') {
  const iconMap = {
    success: 'icon48.png',
    error: 'icon48.png',
    info: 'icon48.png'
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconMap[type] || 'icon48.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Load saved state on startup
chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get('featureEnabled');
  featureEnabled = data.featureEnabled || false;
  console.log('Extension started. Feature enabled:', featureEnabled);
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ featureEnabled: false });
  console.log('Extension installed. Commands registered.');
  
  // Log all registered commands
  const commands = await chrome.commands.getAll();
  console.log('Registered commands:', commands);
});
