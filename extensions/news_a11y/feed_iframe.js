// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function reportHeight() {
  var msg = JSON.stringify({type:"size", size:document.body.offsetHeight});
  parent.postMessage(msg, "*");
}

function frameLoaded() {
  var links = document.getElementsByTagName("A");
  for (i = 0; i < links.length; i++) {
    var c = links[i].className;
    if (c != "item_title" && c != "open_box") {
      links[i].addEventListener("click", showStory);
    }
  }
  window.addEventListener("message", messageHandler);
}

function showStory(event) {
  var href = event.currentTarget.href;
  parent.postMessage(JSON.stringify({type:"show", url:href}), "*");
  event.preventDefault();
}

function messageHandler(event) {
  reportHeight();
}

document.addEventListener('DOMContentLoaded', frameLoaded);
