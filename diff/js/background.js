/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

function onLaunched(launchData) {
  chrome.app.window.create('main.html', {
    width: 1195,
    height: 800
  });
}

chrome.experimental.app.onLaunched.addListener(onLaunched);
