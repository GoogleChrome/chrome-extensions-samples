// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var counter=0;
document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('reset').addEventListener('click', function(event) {
    counter=0;
    document.querySelector("#result").innerHTML="";
  });

  document.getElementById('sendMessage').addEventListener('click', function(event) {
    counter++;
    var message = {
      command: 'render',
      templateName: 'sample-template-'+counter,
      context: {'counter': counter}
    };
    document.getElementById('theFrame').contentWindow.postMessage(message, '*');
  });

  // on result from sandboxed frame:
  window.addEventListener('message', function(event) {
    document.querySelector("#result").innerHTML=event.data.result || "invalid result"
  });
});

