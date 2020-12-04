// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Restore the option last saved.
window.onload = function() {
  chrome.storage.local.get(['tabCaptureMethod'], function(result) {
    if (result.tabCaptureMethod == 'streamId') {
      document.getElementById('streamId').checked = true;
    } else {
      document.getElementById('capture').checked = true;
    }
  });
}

// Save option locally.
function saveOption(){
  var value = document.querySelector('input[name="method"]:checked').value;
  chrome.storage.local.set({'tabCaptureMethod': value}, function() {
    var status = document.getElementById('status');
    status.textContent = "Option saved.";
    setTimeout(function() {status.textContent = '';}, 750);
  });
}

document.getElementById('save').addEventListener('click', saveOption);