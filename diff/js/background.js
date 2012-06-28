/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

function onLaunched(launchData) {
  chrome.appWindow.create('main.html', {
    width: 1024,
    height: 768
  });
}

chrome.experimental.app.onLaunched.addListener(onLaunched);
