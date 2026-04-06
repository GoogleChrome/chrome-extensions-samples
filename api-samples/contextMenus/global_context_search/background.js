// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module.
import { tldLocales } from './locales.js';

// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(async () => {
  for (const [tld, locale] of Object.entries(tldLocales)) {
    chrome.contextMenus.create(
      {
        id: tld,
        title: `Search Google ${locale} for "%s"`,
        type: 'normal',
        contexts: ['selection']
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn(
            `Failed to create menu item for "${tld}":`,
            chrome.runtime.lastError.message
          );
        }
      }
    );
  }
});

// Open a new search tab when the user clicks a context menu item.
// tab can be undefined in some contexts (e.g. chrome://extensions),
// so we only set index if tab is available.
chrome.contextMenus.onClicked.addListener((item, tab) => {
  const tld = item.menuItemId;
  const url = new URL(`https://google.${tld}/search`);
  url.searchParams.set('q', item.selectionText);
  chrome.tabs.create({
    url: url.href,
    ...(tab && { index: tab.index + 1 })
  });
});

// Add or remove the locale from context menu
// when the user checks or unchecks the locale in the popup
chrome.storage.onChanged.addListener(({ enabledTlds }) => {
  if (typeof enabledTlds === 'undefined') return;

  const allTlds = Object.keys(tldLocales);
  const currentTlds = new Set(enabledTlds.newValue);
  const oldTlds = new Set(enabledTlds.oldValue ?? allTlds);
  const changes = allTlds.map((tld) => ({
    tld,
    added: currentTlds.has(tld) && !oldTlds.has(tld),
    removed: !currentTlds.has(tld) && oldTlds.has(tld)
  }));

  for (const { tld, added, removed } of changes) {
    if (added) {
      chrome.contextMenus.create(
        {
          id: tld,
          title: tldLocales[tld],
          type: 'normal',
          contexts: ['selection']
        },
        () => {
          if (chrome.runtime.lastError) {
            console.warn(
              `Failed to create menu item for "${tld}":`,
              chrome.runtime.lastError.message
            );
          }
        }
      );
    } else if (removed) {
      chrome.contextMenus.remove(tld, () => {
        if (chrome.runtime.lastError) {
          console.warn(
            `Failed to remove menu item for "${tld}":`,
            chrome.runtime.lastError.message
          );
        }
      });
    }
  }
});
