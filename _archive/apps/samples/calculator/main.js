/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/


/**
 * Listens for the app launching then creates the window
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('calculator.html', {
    id: "calcWinID",
    innerBounds: {
      width: 244,
      height: 380,
      minWidth: 244,
      minHeight: 380
    }
  });
});
