// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module.
import { regions } from './locales.js';

/**
 * Creates context menu items when the extension is installed.
 * Each region gets its own context menu option for searching.
 */
chrome.runtime.onInstalled.addListener(async () => {
  for (const [regionId, regionConfig] of Object.entries(regions)) {
    chrome.contextMenus.create({
      id: regionId,
      title: regionConfig.display,
      type: 'normal',
      contexts: ['selection']
    });
  }
});

/**
 * Performs a Google Search with region-specific parameters when menu item is clicked.
 *
 * Uses the base URL https://www.google.com/search with query parameters:
 * - q: the search query (user selection)
 * - cr: country restriction parameter
 * - lr: language restriction parameter
 */
chrome.contextMenus.onClicked.addListener((item, tab) => {
  const regionId = item.menuItemId;
  const regionConfig = regions[regionId];

  // Build the search URL with region parameters
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', item.selectionText);
  url.searchParams.set('cr', regionConfig.country);
  url.searchParams.set('lr', regionConfig.language);

  chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});

/**
 * Updates the context menu when the user toggles regions in the popup.
 * Adds or removes menu items based on user preferences.
 */
chrome.storage.onChanged.addListener(({ enabledRegions }) => {
  if (typeof enabledRegions === 'undefined') return;

  const allRegionIds = Object.keys(regions);
  const currentRegions = new Set(enabledRegions.newValue);
  const oldRegions = new Set(enabledRegions.oldValue ?? allRegionIds);

  for (const regionId of allRegionIds) {
    const wasEnabled = oldRegions.has(regionId);
    const isEnabled = currentRegions.has(regionId);

    if (isEnabled && !wasEnabled) {
      // Region was enabled, add menu item
      chrome.contextMenus.create({
        id: regionId,
        title: regions[regionId].display,
        type: 'normal',
        contexts: ['selection']
      });
    } else if (!isEnabled && wasEnabled) {
      // Region was disabled, remove menu item
      chrome.contextMenus.remove(regionId);
    }
  }
});
