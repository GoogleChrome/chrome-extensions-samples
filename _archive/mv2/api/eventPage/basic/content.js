// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.body.innerHTML = "";

function addButton(name, cb) {
  var a = document.createElement("button");
  a.innerText = name;
  a.onclick = cb;
  document.body.appendChild(document.createElement("br"));
  document.body.appendChild(a);
}

function log(str) {
  console.log(str);
  logDiv.innerHTML += str + "<br>";
}

addButton("Clear logs", function() {
  logDiv.innerHTML = "";
});

addButton("Send message with delayed response", function() {
  chrome.runtime.sendMessage({delayedResponse: true}, function(response) {
    log("Background page responded: " + response);
  });
});

addButton("Show counters", function() {
  chrome.runtime.sendMessage({getCounters: true}, function(response) {
    log("In-memory counter is: " + response.counter);
    log("Persisted counter is: " + response.persistentCounter);
  });
});

addButton("Set an alarm", function() {
  chrome.runtime.sendMessage({setAlarm: true});
});

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  log("Got message from background page: " + msg);
});

var logDiv = document.createElement("div");
logDiv.style.border = "1px dashed black";
document.body.appendChild(document.createElement("br"));
document.body.appendChild(logDiv);

log("Ready.");
