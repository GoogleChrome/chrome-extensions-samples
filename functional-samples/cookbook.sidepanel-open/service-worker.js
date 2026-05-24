// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openSidePanel',
    title: 'Open side panel',
    contexts: ['all']
  });
  chrome.tabs.create({ url: 'page.html' });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openSidePanel') {
    // This will open the panel in all the pages on the current window.
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

async function enableTabSidePanel(tabId) {
  await chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel-tab.html',
    enabled: true
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // The callback for runtime.onMessage must return falsy if we're not sending a response
  const tabId = sender.tab?.id;
  if (!tabId) return;

  if (message.type === 'enable_tab_side_panel') {
    enableTabSidePanel(tabId)
      .catch((error) => console.error(error))
      .finally(sendResponse);
    return true;
  }

  if (message.type === 'open_side_panel') {
    // This will open a tab-specific side panel only on the current tab.
    chrome.sidePanel.open({ tabId }).catch((error) => console.error(error));
  }
});
