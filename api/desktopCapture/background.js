// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    bounds: {
      width: 1080,
      height: 550
    }
  });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window"],
      function(id) {
        sendResponse({"id": id});
      });
});
