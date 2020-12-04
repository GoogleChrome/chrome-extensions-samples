// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.extension.isAllowedFileSchemeAccess(function(state) {
  var el = document.getElementById('file');
  el.textContent = el.className = state ? 'true': 'false';
});
chrome.extension.isAllowedIncognitoAccess(function(state) {
  var el = document.getElementById('incognito');
  el.textContent = el.className = state ? 'true': 'false';
});
