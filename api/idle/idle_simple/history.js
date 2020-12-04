// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Convert a state and time into a nice styled chunk of HTML.
 */
function renderState(state, time) {
  var now = new Date().getTime();
  var diff = Math.round((time.getTime() - now) / 1000);
  var str = (diff == 0) ?
      "now" :
      Math.abs(diff) + " seconds " + (diff > 0 ? "from now" : "ago");
  var col = (state == "active") ?
      "#009900" :
      "#990000";
  return "<b style='color: " + col + "'>" + state + "</b> " + str;
};

/**
 * Creates DOM and injects a rendered state into the page.
 */
function renderItem(state, time, parent) {
  var dom_item = document.createElement('li');
  dom_item.innerHTML = renderState(state, time);
  parent.appendChild(dom_item);
};

// Store previous state so we can show deltas.  This is important
// because the API currently doesn't fire idle messages, and we'd
// like to keep track of last time we went idle.
var laststate = null;
var laststatetime = null;

/**
 * Checks the current state of the browser.
 */
function checkState() {
  threshold = parseInt(document.querySelector('#idle-threshold').value);
  var dom_threshold = document.querySelector('#idle-set-threshold');
  dom_threshold.innerText = threshold;

  // Request the state based off of the user-supplied threshold.
  chrome.idle.queryState(threshold, function(state) {
    var time = new Date();
    if (laststate != state) {
      laststate = state;
      laststatetime = time;
    }

    // Keep rendering results so we get a nice "seconds elapsed" view.
    var dom_result = document.querySelector('#idle-state');
    dom_result.innerHTML = renderState(state, time);
    var dom_laststate = document.querySelector('#idle-laststate');
    dom_laststate.innerHTML = renderState(laststate, laststatetime);
  });
};

var dom_history = document.querySelector('#idle-history');

/**
 * Render the data gathered by the background page - should show a log
 * of "active" states.  No events are fired upon idle.
 */
function renderHistory() {
  dom_history.innerHTML = "";
  var history_log = chrome.extension.getBackgroundPage().history_log;
  for (var i = 0; i < history_log.length; i++) {
    var data = history_log[i];
    renderItem(data['state'], data['time'], dom_history);
  }
};


document.addEventListener('DOMContentLoaded', function() {
  // Check every second (even though this is overkill - minimum idle
  // threshold is 15 seconds) so that the numbers appear to be counting up.
  checkState();
  window.setInterval(checkState, 1000);

  // Check every second (see above).
  renderHistory();
  window.setInterval(renderHistory, 1000);
});
