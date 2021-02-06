// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function playSound(id) {
  console.log(id);
  chrome.extension.getBackgroundPage().playSound(id, false);
}

function stopSound(id) {
  chrome.extension.getBackgroundPage().stopSound(id);
}

function soundChanged(event) {
  var key = event.target.name;
  var checked = event.target.checked;
  if (checked) {
    localStorage.setItem(key, "enabled");
    playSound(event.target.name);
  } else {
    localStorage.setItem(key, "disabled");
    stopSound(event.target.name);
  }
}

function showSounds() {
  var sounds = document.getElementById("sounds");
  if (!localStorage.length) {
    sounds.innerText = "";
    return;
  }
  sounds.innerText = "Discovered sounds: (uncheck to disable)";
  var keys = new Array();
  for (var key in localStorage) {
    keys.push(key);
    console.log(key);
  }
  keys.sort();
  for (var index in keys) {
    var key = keys[index];
    var div = document.createElement("div");
    var check = document.createElement("input");
    check.type = "checkbox"
    check.name = key;
    check.checked = localStorage[key] == "enabled";
    check.onchange = soundChanged;
    div.appendChild(check);
    var text = document.createElement("span");
    text.id = key;
    text.innerText = key;
    text.className = "sound";
    text.onclick = function(event) { playSound(event.target.id); };
    div.appendChild(text);
    sounds.appendChild(div);
  }
}

document.addEventListener('DOMContentLoaded', showSounds);
document.addEventListener('focus', showSounds);
