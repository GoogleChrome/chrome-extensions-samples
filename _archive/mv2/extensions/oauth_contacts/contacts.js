// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var contacts = chrome.extension.getBackgroundPage().contacts;
var output = document.getElementById('output');
for (var i = 0, contact; contact = contacts[i]; i++) {
  var div = document.createElement('div');
  var pName = document.createElement('p');
  var ulEmails = document.createElement('ul');

  pName.innerText = contact['name'];
  div.appendChild(pName);

  for (var j = 0, email; email = contact['emails'][j]; j++) {
    var liEmail = document.createElement('li');
    liEmail.innerText = email;
    ulEmails.appendChild(liEmail);
  }

  div.appendChild(ulEmails);
  output.appendChild(div);
}

function logout() {
  chrome.extension.getBackgroundPage().logout();
  window.close();
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#clear').addEventListener('click', logout);
});
