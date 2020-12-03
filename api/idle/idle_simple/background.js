// Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
// source code is governed by a BSD-style license that can be found in the
// LICENSE file.

var history_log = [];

/**
* Stores a state every time an "active" event is sent, up to 20 items.
*/
chrome.idle.onStateChanged.addListener(function(newstate) {
  var time = new Date();
  if (history_log.length >= 20) {
    history_log.pop();
  }
  history_log.unshift({'state':newstate, 'time':time});
});

/**
* Opens history.html when the browser action is clicked.
* Used window.open because I didn't want the tabs permission.
*/
chrome.browserAction.onClicked.addListener(function() {
  window.open('history.html', 'testwindow', 'width=700,height=600');
});
