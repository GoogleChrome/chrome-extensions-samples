// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var attachedTabs = {};
var version = "1.0";

chrome.debugger.onEvent.addListener(onEvent);
chrome.debugger.onDetach.addListener(onDetach);

chrome.browserAction.onClicked.addListener(function(tab) {
  var tabId = tab.id;
  var debuggeeId = {tabId:tabId};

  if (attachedTabs[tabId] == "pausing")
    return;

  if (!attachedTabs[tabId])
    chrome.debugger.attach(debuggeeId, version, onAttach.bind(null, debuggeeId));
  else if (attachedTabs[tabId])
    chrome.debugger.detach(debuggeeId, onDetach.bind(null, debuggeeId));
});

function onAttach(debuggeeId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  var tabId = debuggeeId.tabId;
  chrome.browserAction.setIcon({tabId: tabId, path:"debuggerPausing.png"});
  chrome.browserAction.setTitle({tabId: tabId, title:"Pausing JavaScript"});
  attachedTabs[tabId] = "pausing";
  chrome.debugger.sendCommand(
      debuggeeId, "Debugger.enable", {},
      onDebuggerEnabled.bind(null, debuggeeId));
}

function onDebuggerEnabled(debuggeeId) {
  chrome.debugger.sendCommand(debuggeeId, "Debugger.pause");
}

function onEvent(debuggeeId, method) {
  var tabId = debuggeeId.tabId;
  if (method == "Debugger.paused") {
    attachedTabs[tabId] = "paused";
    chrome.browserAction.setIcon({tabId:tabId, path:"debuggerContinue.png"});
    chrome.browserAction.setTitle({tabId:tabId, title:"Resume JavaScript"});
  }
}

function onDetach(debuggeeId) {
  var tabId = debuggeeId.tabId;
  delete attachedTabs[tabId];
  chrome.browserAction.setIcon({tabId:tabId, path:"debuggerPause.png"});
  chrome.browserAction.setTitle({tabId:tabId, title:"Pause JavaScript"});
}
