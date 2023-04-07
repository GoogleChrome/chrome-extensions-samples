// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.browserAction.onClicked.addListener(function() {
  var iframe = document.getElementById('theFrame');
  var message = {
    command: 'render',
    context: {thing: 'world'}
  };
  iframe.contentWindow.postMessage(message, '*');
});


window.addEventListener('message', function(event) {
  if (event.data.html) {
    new Notification('Templated!', {
      icon: 'icon.png',
      body: 'HTML Received for "' + event.data.name + '": `' +
          event.data.html + '`'
    });
  }
});
