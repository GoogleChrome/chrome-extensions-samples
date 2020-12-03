// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var ime_api = chrome.input.ime;

var context_id = -1;

console.log("Initializing IME");

ime_api.onFocus.addListener(function(context) {
  console.log('onFocus:' + context.contextID);
  context_id = context.contextID;
});
ime_api.onBlur.addListener(function(contextID) {
  console.log('onBlur:' + contextID);
  context_id = -1;
});

ime_api.onActivate.addListener(function(engineID) {
  console.log('onActivate:' + engineID);
});
ime_api.onDeactivated.addListener(function(engineID) {
  console.log('onDeactivated:' + engineID);
});

ime_api.onKeyEvent.addListener(
function(engineID, keyData) {
  console.log('onKeyEvent:' + keyData.key + " context: " + context_id);
  if (keyData.type == "keydown" && keyData.key.match(/^[a-z]$/)) {
    chrome.input.ime.commitText({"contextID": context_id,
                                 "text": keyData.key.toUpperCase()});
    return true;
  }

  return false
});
