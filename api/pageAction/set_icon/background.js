// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var lastTabId = 0;
var tab_clicks = {};

chrome.tabs.onSelectionChanged.addListener(function(tabId) {
  lastTabId = tabId;
  chrome.pageAction.show(lastTabId);
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  lastTabId = tabs[0].id;
  chrome.pageAction.show(lastTabId);
});

// Called when the user clicks on the page action.
chrome.pageAction.onClicked.addListener(function(tab) {
  var clicks = tab_clicks[tab.id] || 0;
  chrome.pageAction.setIcon({path: "icon" + (clicks + 1) + ".png",
                             tabId: tab.id});
  if (clicks % 2) {
    chrome.pageAction.show(tab.id);
  } else {
    chrome.pageAction.hide(tab.id);
    setTimeout(function() { chrome.pageAction.show(tab.id); }, 200);
  }
  chrome.pageAction.setTitle({title: "click:" + clicks, tabId: tab.id});

  // We only have 2 icons, but cycle through 3 icons to test the
  // out-of-bounds index bug.
  clicks++;
  if (clicks > 3)
    clicks = 0;
  tab_clicks[tab.id] = clicks;
});

var i = 0;
window.setInterval(function() {
  var clicks = tab_clicks[lastTabId] || 0;

  // Don't animate while in "click" mode.
  if (clicks > 0) return;

  // Don't do anything if we don't have a tab yet.
  if (lastTabId == 0) return;

  i++;
  chrome.pageAction.setIcon({imageData: draw(i*2, i*4), tabId: lastTabId});
}, 50);

function draw(starty, startx) {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0,200,0,255)";
  context.fillRect(startx % 19, starty % 19, 8, 8);
  context.fillStyle = "rgba(0,0,200,255)";
  context.fillRect((startx + 5) % 19, (starty + 5) % 19, 8, 8);
  context.fillStyle = "rgba(200,0,0,255)";
  context.fillRect((startx + 10) % 19, (starty + 10) % 19, 8, 8);
  return context.getImageData(0, 0, 19, 19);
}
