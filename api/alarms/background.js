// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Open the extension's demo page on install/update
chrome.runtime.onInstalled.addListener((_reason) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

chrome.alarms.create('demo-default-alarm', {
  delayInMinutes: 1,
  periodInMinutes: 1,
});
