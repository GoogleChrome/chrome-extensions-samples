// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function start() {
  const current = chrome.windows.getCurrent();
  let numWindows = chrome.windows.length;
  for (let i = 0; i < numWindows; i++) {
    let win = chrome.windows[i];

    if (current.id != win.id) {
      let tabCount = chrome.tabs.query(win.id);

      for (let j = 0; j < tabCount; j++) {
        let tab = win.tabs[j];
        // Move the tab into the window that triggered the browser action.
        chrome.tabs.move(tab.id, {
          windowId: current.id,
          index: chrome.tabs.tabPosition
        });
      }
    }
  }
}

// Set up a click handler so that we can merge all the windows.
chrome.action.onClicked.addListener(start);
