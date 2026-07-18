// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module,
import { regionOptions } from './locales.js';

// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(async () => {
  for (const [region, label] of Object.entries(regionOptions)) {
    chrome.contextMenus.create({
      id: region,
      title: label,
      type: 'normal',
      contexts: ['selection']
    });
  }
});

// Open a new search tab when the user clicks a context menu
chrome.contextMenus.onClicked.addListener((item, tab) => {
  const region = item.menuItemId;
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', item.selectionText);
  url.searchParams.set('cr', `country${region}`);
  chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});

// Add or remove regions from the context menu
// when the user checks or unchecks a region in the popup
chrome.storage.onChanged.addListener(({ enabledRegions }) => {
  if (typeof enabledRegions === 'undefined') return;

  const allRegions = Object.keys(regionOptions);
  const currentRegions = new Set(enabledRegions.newValue);
  const oldRegions = new Set(enabledRegions.oldValue ?? allRegions);
  const changes = allRegions.map((region) => ({
    region,
    added: currentRegions.has(region) && !oldRegions.has(region),
    removed: !currentRegions.has(region) && oldRegions.has(region)
  }));

  for (const { region, added, removed } of changes) {
    if (added) {
      chrome.contextMenus.create({
        id: region,
        title: regionOptions[region],
        type: 'normal',
        contexts: ['selection']
      });
    } else if (removed) {
      chrome.contextMenus.remove(region);
    }
  }
});
