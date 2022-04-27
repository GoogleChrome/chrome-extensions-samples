// Copyright 2017 Google LLC
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

// When you specify "type": "module" in the manifest background,
// you can include the service worker as an ES Module,
import { tldLocales } from './locales.js'

// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(async () => {
  for (let [tld, locale] of Object.entries(tldLocales)) {
    chrome.contextMenus.create({
      id: tld,
      title: locale,
      type: 'normal',
      contexts: ['selection'],
    });
  }
});

// Open a new search tab when the user clicks a context menu
chrome.contextMenus.onClicked.addListener((item, tab) => {
  const tld = item.menuItemId
  let url = new URL(`https://google.${tld}/search`)
  url.searchParams.set('q', item.selectionText)
  chrome.tabs.create({ url: url.href, index: tab.index + 1 });
});

// Add or removes the locale from context menu
// when the user checks or unchecks the locale in the popup
chrome.storage.onChanged.addListener(({ enabledTlds }) => {
  if (typeof enabledTlds === 'undefined') return

  let allTlds = Object.keys(tldLocales)
  let currentTlds = new Set(enabledTlds.newValue);
  let oldTlds = new Set(enabledTlds.oldValue ?? allTlds);
  let changes = allTlds.map((tld) => ({
    tld,
    added: currentTlds.has(tld) && !oldTlds.has(tld),
    removed: !currentTlds.has(tld) && oldTlds.has(tld)
  }))

  for (let { tld, added, removed } of changes) {
    if (added) {
      chrome.contextMenus.create({
        id: tld,
        title: tldLocales[tld],
        type: 'normal',
        contexts: ['selection'],
      });
    }
    else if (removed) {
      chrome.contextMenus.remove(tld);
    }
  }

});
