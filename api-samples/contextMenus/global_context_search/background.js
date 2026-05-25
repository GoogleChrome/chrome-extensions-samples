// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module,
import { countryLocales } from './locales.js';

// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(async () => {
  for (const [countryCode, locale] of Object.entries(countryLocales)) {
    chrome.contextMenus.create({
      id: countryCode,
      title: locale,
      type: 'normal',
      contexts: ['selection']
    });
  }
});

// Open a new search tab when the user clicks a context menu
chrome.contextMenus.onClicked.addListener((item, tab) => {
  const countryCode = item.menuItemId;
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', item.selectionText);
  url.searchParams.set('cr', `country${countryCode}`);
  chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});

// Add or removes the locale from the context menu
// when the user checks or unchecks the locale in the popup
chrome.storage.onChanged.addListener(({ enabledCountries }) => {
  if (typeof enabledCountries === 'undefined') return;

  const allCountries = Object.keys(countryLocales);
  const currentCountries = new Set(enabledCountries.newValue);
  const oldCountries = new Set(enabledCountries.oldValue ?? allCountries);
  const changes = allCountries.map((countryCode) => ({
    countryCode,
    added: currentCountries.has(countryCode) && !oldCountries.has(countryCode),
    removed: !currentCountries.has(countryCode) && oldCountries.has(countryCode)
  }));

  for (const { countryCode, added, removed } of changes) {
    if (added) {
      chrome.contextMenus.create({
        id: countryCode,
        title: countryLocales[countryCode],
        type: 'normal',
        contexts: ['selection']
      });
    } else if (removed) {
      chrome.contextMenus.remove(countryCode);
    }
  }
});
