// Copyright 2024 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// DOM elements
const commandsList = document.getElementById('commands-list');
const toggleBtn = document.getElementById('toggle-btn');
const screenshotBtn = document.getElementById('screenshot-btn');
const notificationBtn = document.getElementById('notification-btn');
const openShortcutsBtn = document.getElementById('open-shortcuts-btn');
const statusLight = document.getElementById('status-light');
const statusText = document.getElementById('status-text');
const toast = document.getElementById('toast');

// Load and display all commands
async function loadCommands() {
  try {
    const commands = await chrome.commands.getAll();
    displayCommands(commands);
  } catch (error) {
    console.error('Failed to load commands:', error);
    showToast('Failed to load commands', 'error');
  }
}

// Display commands in the UI
function displayCommands(commands) {
  if (commands.length === 0) {
    commandsList.innerHTML = '<p style="color: #5f6368;">No commands registered</p>';
    return;
  }

  commandsList.innerHTML = commands.map(command => {
    const shortcut = command.shortcut || 'Not set';
    const isSet = command.shortcut && command.shortcut.length > 0;
    
    return `
      <div class="command-item">
        <div class="command-name">${escapeHtml(command.name)}</div>
        <div class="command-description">${escapeHtml(command.description || 'No description')}</div>
        <span class="command-shortcut ${isSet ? '' : 'not-set'}">${escapeHtml(shortcut)}</span>
      </div>
    `;
  }).join('');
}

// Load and display feature status
async function loadStatus() {
  try {
    const data = await chrome.storage.local.get('featureEnabled');
    const enabled = data.featureEnabled || false;
    updateStatusDisplay(enabled);
  } catch (error) {
    console.error('Failed to load status:', error);
  }
}

// Update status display
function updateStatusDisplay(enabled) {
  statusLight.className = enabled ? 'light on' : 'light off';
  statusText.textContent = enabled ? 'Feature is ON' : 'Feature is OFF';
}

// Event listeners
toggleBtn.addEventListener('click', async () => {
  try {
    // Get current state
    const data = await chrome.storage.local.get('featureEnabled');
    const currentState = data.featureEnabled || false;
    const newState = !currentState;
    
    // Update state
    await chrome.storage.local.set({ featureEnabled: newState });
    updateStatusDisplay(newState);
    
    showToast(`Feature ${newState ? 'enabled' : 'disabled'}`, 'success');
  } catch (error) {
    console.error('Toggle failed:', error);
    showToast('Failed to toggle feature', 'error');
  }
});

screenshotBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showToast('No active tab found', 'error');
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await chrome.downloads.download({
      url: dataUrl,
      filename: `screenshot-${timestamp}.png`,
      saveAs: false
    });
    
    showToast('Screenshot saved!', 'success');
  } catch (error) {
    console.error('Screenshot failed:', error);
    showToast('Screenshot failed: ' + error.message, 'error');
  }
});

notificationBtn.addEventListener('click', () => {
  const timestamp = new Date().toLocaleTimeString();
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Test Notification',
    message: `Notification triggered at ${timestamp}`,
    priority: 2
  });
  showToast('Notification sent!', 'success');
});

openShortcutsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// Listen for storage changes to update status in real-time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.featureEnabled) {
    updateStatusDisplay(changes.featureEnabled.newValue);
  }
});

// Utility functions
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
loadCommands();
loadStatus();
