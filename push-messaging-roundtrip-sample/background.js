// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This function gets called in the packaged app model on launch.
chrome.app.runtime.onLaunched.addListener(function() {
  console.log("Push Messaging Roundtrip Sample App Launched!");
  chrome.app.window.create('push_messaging_roundtrip_sample.html');
});
