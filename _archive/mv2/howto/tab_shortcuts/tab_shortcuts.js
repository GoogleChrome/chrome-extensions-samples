// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Register a callback function with the commands api, which will be called when
 * one of our registered commands is detected.
 */
chrome.commands.onCommand.addListener(function(command) {
  // Call 'update' with an empty properties object to get access to the current
  // tab (given to us in the callback function).
  chrome.tabs.update({}, function(tab) {
    if (command == 'toggle-pin-tab')
      chrome.tabs.update({pinned: !tab.pinned});
    else if (command == 'duplicate-tab')
      chrome.tabs.duplicate(tab.id);
  });
});
