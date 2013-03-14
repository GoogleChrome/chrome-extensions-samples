/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

function onLaunched(launchData) {
  chrome.app.window.create('main.html', {
    bounds: {
      width: 1270,
      height: 800
    }
  });
}

chrome.app.runtime.onLaunched.addListener(onLaunched);
