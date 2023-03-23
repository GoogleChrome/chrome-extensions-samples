/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/


/**
 * Listens for the extension launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.runtime.onStartup.addListener(function() {
  chrome.windows.create({
    url: 'calculator.html',
    width: 244,
    height: 380
  });
});
