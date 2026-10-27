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

  // Automatically open the extension's main page after installation
  chrome.tabs.create({ url: 'page.html' });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'openSidePanel') {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel-global.html',
      enabled: true
    });
  }
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'open_side_panel') {
    await chrome.sidePanel.open({ tabId: sender.tab.id });
    await chrome.sidePanel.setOptions({
      tabId: sender.tab.id,
      path: 'sidepanel-tab.html',
      enabled: true
    });
  }
});
