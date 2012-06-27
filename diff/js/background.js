/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

function onLaunched(launchData) {
  chrome.appWindow.create('main.html', {
    width: 1250,
    height: 790
  });
}

chrome.experimental.app.onLaunched.addListener(onLaunched);
