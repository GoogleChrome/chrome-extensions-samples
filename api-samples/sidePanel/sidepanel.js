// Copyright 2024 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// DOM elements
const refreshTabBtn = document.getElementById('refresh-tab-btn');
const tabInfoContainer = document.getElementById('tab-info');
const panelWidthDisplay = document.getElementById('panel-width');
const stateInput = document.getElementById('state-input');
const saveStateBtn = document.getElementById('save-state');
const loadStateBtn = document.getElementById('load-state');
const themeButtons = document.querySelectorAll('.btn-theme');
const openNewTabBtn = document.getElementById('open-new-tab');
const reloadTabBtn = document.getElementById('reload-tab');
const bookmarkTabBtn = document.getElementById('bookmark-tab');
const notesArea = document.getElementById('notes-area');
const saveStatus = document.getElementById('save-status');
const clearNotesBtn = document.getElementById('clear-notes');
const behaviorSelect = document.getElementById('behavior-select');
const panelStateDisplay = document.getElementById('panel-state');
const windowIdDisplay = document.getElementById('window-id');
const demoPersistentBtn = document.getElementById('demo-persistent');

// Initialize
init();

async function init() {
  updatePanelWidth();
  loadTheme();
  loadNotes();
  loadWindowInfo();
  
  // Update width on resize
  window.addEventListener('resize', updatePanelWidth);
  
  // Auto-save notes
  let saveTimeout;
  notesArea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveStatus.textContent = 'Typing...';
    saveTimeout = setTimeout(() => {
      saveNotes();
    }, 1000);
  });
}

// Tab information
refreshTabBtn.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' });
    const tab = response.tab;
    
    if (tab) {
      displayTabInfo(tab);
    } else {
      tabInfoContainer.innerHTML = '<p class="loading">No active tab found</p>';
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
    tabInfoContainer.innerHTML = `<p style="color: var(--error);">Error: ${error.message}</p>`;
  }
});

function displayTabInfo(tab) {
  tabInfoContainer.innerHTML = `
    <div class="tab-info-item">
      <strong>Title:</strong>
      <span>${escapeHtml(tab.title || 'N/A')}</span>
    </div>
    <div class="tab-info-item">
      <strong>URL:</strong>
      <span>${escapeHtml(tab.url || 'N/A')}</span>
    </div>
    <div class="tab-info-item">
      <strong>Tab ID:</strong>
      <span>${tab.id}</span>
    </div>
    <div class="tab-info-item">
      <strong>Status:</strong>
      <span>${tab.status}</span>
    </div>
  `;
}

// Panel width tracking
function updatePanelWidth() {
  const width = window.innerWidth;
  panelWidthDisplay.textContent = width;
}

// State management
saveStateBtn.addEventListener('click', async () => {
  const value = stateInput.value;
  await chrome.storage.local.set({ savedState: value });
  alert('State saved!');
});

loadStateBtn.addEventListener('click', async () => {
  const data = await chrome.storage.local.get('savedState');
  stateInput.value = data.savedState || '';
  if (data.savedState) {
    alert('State loaded!');
  } else {
    alert('No saved state found');
  }
});

// Theme management
themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    setTheme(theme);
  });
});

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  chrome.storage.local.set({ theme });
}

async function loadTheme() {
  const data = await chrome.storage.local.get('theme');
  if (data.theme) {
    document.body.setAttribute('data-theme', data.theme);
  }
}

// Quick actions
openNewTabBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.google.com' });
});

reloadTabBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.reload(tab.id);
  }
});

bookmarkTabBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    try {
      await chrome.bookmarks.create({
        title: tab.title,
        url: tab.url
      });
      alert('Bookmark created!');
    } catch (error) {
      alert('Failed to create bookmark. Make sure bookmarks permission is granted.');
    }
  }
});

// Notes management
async function saveNotes() {
  const notes = notesArea.value;
  await chrome.storage.local.set({ notes });
  saveStatus.textContent = 'Saved ✓';
  setTimeout(() => {
    saveStatus.textContent = 'Ready';
  }, 2000);
}

async function loadNotes() {
  const data = await chrome.storage.local.get('notes');
  if (data.notes) {
    notesArea.value = data.notes;
  }
}

clearNotesBtn.addEventListener('click', async () => {
  if (confirm('Clear all notes?')) {
    notesArea.value = '';
    await chrome.storage.local.remove('notes');
    saveStatus.textContent = 'Cleared';
  }
});

// Panel behavior
behaviorSelect.addEventListener('change', (e) => {
  console.log('Panel behavior changed to:', e.target.value);
  // In a real implementation, you would use chrome.sidePanel.setOptions()
  // to change the panel behavior per tab
});

// Demo persistent navigation
demoPersistentBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://developer.chrome.com/docs/extensions/reference/sidePanel/' });
  alert('Notice how the side panel stays open as you navigate!');
});

// Window info
async function loadWindowInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      windowIdDisplay.textContent = tab.windowId;
    }
  } catch (error) {
    console.error('Error loading window info:', error);
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Log panel lifecycle
console.log('Side panel loaded');

window.addEventListener('beforeunload', () => {
  console.log('Side panel closing');
});
