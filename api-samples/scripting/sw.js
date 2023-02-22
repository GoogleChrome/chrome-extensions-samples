// Copyright 2022 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

chrome.action.onClicked.addListener(openDemoTab);

function openDemoTab() {
  chrome.tabs.create({ url: 'index.html' });
}

chrome.webNavigation.onDOMContentLoaded.addListener(async ({ tabId, url }) => {
  if (url === 'https://example.com/#inject-programmatic') {
    const { options } = await chrome.storage.local.get('options');
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js'],
      ...options
    });
  }
});

chrome.runtime.onMessage.addListener(async ({ name, options }) => {
  if (name === 'inject-programmatic') {
    await chrome.storage.local.set({ options });
    await chrome.tabs.create({
      url: 'https://example.com/#inject-programmatic'
    });
  }
});
