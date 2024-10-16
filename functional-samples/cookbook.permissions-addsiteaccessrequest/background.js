// Copyright 2024 Google LLC
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

/**
 * Adds a site access request if the user visits https://example.com/checkout.
 * This could be useful for an extension that wishes to offer users coupons or
 * order tracking but needs access to the site to do so.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changes) => {
  if (typeof changes.url !== 'string') return;

  const url = new URL(changes.url);

  // If we are on the /checkout page of example.com.
  if (url.origin === 'https://example.com' && url.pathname === '/checkout') {
    const hasPermission = await chrome.permissions.contains({
      origins: ['https://example.com/*']
    });

    // We already have host permissions.
    if (hasPermission) {
      return;
    }

    // Add a site access request if the API is available.
    if (chrome.permissions.addSiteAccessRequest) {
      chrome.permissions.addSiteAccessRequest({ tabId });
    }
  }
});

chrome.permissions.onAdded.addListener((permissions) => {
  if (permissions.origins?.includes('https://example.com/*')) {
    console.log('Permission granted.');
    // FIXME: Run any code you wanted to run here.
  }
});
