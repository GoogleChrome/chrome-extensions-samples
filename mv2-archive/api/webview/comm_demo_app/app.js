// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict;'

const kWhitelistedExtensionId = 'dpicdiinminmigempanoghnpckmkfepi';
const kExtensionIds = [kWhitelistedExtensionId];

let portMap = {};
let webview = null;

let initScripts = [];

function createWebView(initScripts) {
  let container = document.getElementById('webview-container');
  webview = document.createElement('webview');
  webview.partition = 'partition';
  webview.style = 'width: 640px; height: 400px';

  webview.addContentScripts([{
    // The value of |embedder| in the script below will persist, and can be
    // used by content script injected into the guest any time to send data
    // back to us.
    name: 'embedderVar',
    matches: ['<all_urls>'],
    js: {code: 'var embedder = null;\n'},
    all_frames: true,
    run_at: 'document_start'
  }]);
  webview.addContentScripts(initScripts);

  webview.addEventListener('contentload', function() {
    webview.executeScript({
      code: 'window.addEventListener(\'message\', function(e){\n' +
          '  if (e.data != \'connect\')\n' +
          '    return;\n' +
          '  console.log(\'msg = \' + e.data);\n' +
          '  embedder = e.source;\n' +
          '  embedder.postMessage(JSON.stringify({\n' +
          '    \'ext_id\' : \'0\',\n' +
          '    \'msg\' : \'Hello from guest!\'}), \'*\');\n' +
          '});'
    });
    // Here we aren't enforcing any particular origin on the guest, but we
    // could if security needs required it.
    webview.contentWindow.postMessage('connect', '*');
  });

  addEventListener('message', function(e) {
    if (e.source != webview.contentWindow)
      return;

    let data;
    try {
      data = JSON.parse(e.data);
    } catch (err) {
      console.warn('invalid JSON format for incoming message: ' + err.message);
    }

    if (!data) {
      console.warn('Malformed message: ' + e.data);
      return;
    }

    if (data.extensionId) {
      if (!data.extensionId in portMap) {
        console.warn('Message for unknown extension: ' + data.extensionId);
        return;
      }
      if (!data.request) {
        console.warn('malformed messgae (no request):' + e.data);
        return;
      }
      // Relay this to the appropriate extension.
      // If the app wants to monitor messages from injected code, this is one
      // place to do it.
      console.log('Request: ' + data.request + ' => ' + data.extensionId);
      portMap[data.extensionId].postMessage({request: data.request});
    } else {
      if (!data.msg) {
        console.warn('malformed message (no msg): ' + e.data);
      }
      console.log('Message for us: ' + data.msg);
    }
  });

  webview.src = 'http://example.com';
  container.appendChild(webview);
}

function connectToExtension(extensionId) {
  let port;
  try {
    port = chrome.runtime.connect(extensionId);
  } catch (e) {
    console.error('Could not connect to extension: ' + e.message);
    return;
  }
  // Save port in map.
  portMap[extensionId] = port;
  port.onDisconnect.addListener(() => {
    delete portMap[extensionId];
  });

  let initPromise = new Promise((resolve, reject) => {
    port.onMessage.addListener(function(msg) {
      // Perhaps check here to make sure |msg.code| exists.
      console.log('Incoming from extension: ' + msg.name + ' -> ' + msg.code);
      if (msg.name == 'ext_getInitScripts') {
        initScripts.push({
          name: 'initScripts-' + extensionId,
          matches: ['<all_urls>'],
          js: {code: msg.code},
          run_at: 'document_start'
        });
        resolve();
      } else {
        webview.executeScript({code: msg.code});
      }
    });
    setTimeout(function() {
      reject('Timeout waiting for initScripts from ' + extensionId);
    }, 5000);
  });

  port.postMessage({request: 'getInitScripts'});

  return initPromise;
}

function setUpExtensionHandlers() {
  let port = portMap[kWhitelistedExtensionId];
  // Some examples of UI in the app requesting services from the guest.
  // The replies from the extension are injected into the guest and executed
  // via the port.onMessage handler declared above.
  document.getElementById('magnify_button')
      .addEventListener('click', function() {
        port.postMessage({request: 'magnify'});
      });
  document.getElementById('background_button')
      .addEventListener('click', function() {
        port.postMessage({request: 'setBackground'});
      });
  document.getElementById('add_div_button')
      .addEventListener('click', function() {
        port.postMessage({request: 'addDiv'});
      });
  document.getElementById('iframe_dataurl_button')
      .addEventListener('click', function() {
        port.postMessage({request: 'iFrameDataURL'});
      });
}

document.addEventListener('DOMContentLoaded', function() {
  promises = [];
  for (let extensionId of kExtensionIds)
    promises.push(connectToExtension(extensionId));

  setUpExtensionHandlers();

  Promise.all(promises).then(function() {
    createWebView(initScripts);
  });
});
