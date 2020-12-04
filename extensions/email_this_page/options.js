// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var gmail = "https://mail.google.com/mail/?extsrc=mailto&url=%s";

function toggle(radioButton) {
  if (window.localStorage == null) {
    alert('Local storage is required for changing providers');
    return;
  }
  if (document.getElementById('gmail').checked) {
    window.localStorage.customMailtoUrl = gmail;
  } else {
    window.localStorage.customMailtoUrl = "";
  }
}

function main() {
  if (window.localStorage == null) {
    alert("LocalStorage must be enabled for changing options.");
    document.getElementById('default').disabled = true;
    document.getElementById('gmail').disabled = true;
    return;
  }

  // Default handler is checked. If we've chosen another provider, we must
  // change the checkmark.
  if (window.localStorage.customMailtoUrl == gmail)
    document.getElementById('gmail').checked = true;
}

document.addEventListener('DOMContentLoaded', function () {
  main();
  document.querySelector('#default').addEventListener('click', toggle);
  document.querySelector('#gmail').addEventListener('click', toggle);
});
