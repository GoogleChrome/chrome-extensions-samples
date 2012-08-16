/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/


/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
 chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('weather.html', {
    height: 280,
    minHeight: 280,
    minWidth: 210,
    maxHeight: 280,
    maxWidth: 210,
    width: 210,
  });
});
