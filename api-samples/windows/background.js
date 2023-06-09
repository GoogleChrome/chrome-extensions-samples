// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

async function start() {
  const current = await chrome.windows.getCurrent();

  const allTabs = await chrome.tabs.query({});
  allTabs.forEach((tab) => {
    if (tab.windowId != current.id) {
      chrome.tabs.move(tab.id, {
        windowId: current.id,
        index: tab.index
      });
    }
  });
}

// Set up a click handler so that we can merge all the windows.
chrome.action.onClicked.addListener(start);
