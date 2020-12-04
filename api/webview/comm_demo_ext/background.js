// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict;'

// Define globals.

// This DataURI image will allow us to demonstrate injecting non-html content
// into a guest.
var chromiumLogoDataURI = 'data:image/png;base64,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';

var iframeDataURL =
    'data:text/html,' +
    '<html>' +
    '  <head>' +
    '    <script>' +
    '      document.addEventListener("DOMContentLoaded", function(){' +
    '        document.getElementById("target").innerText = "Fred.";' +
    '      });' +
    '    </script>' +
    '  </head>' +
    '  <body>' +
    '    <h1>Data URL IFrame</h1>' +
    '    <img src="' + chromiumLogoDataURI + '"><br>' +
    '    <p>A data-url based iframe that has scripts.</p>' +
    '    <p id="target"></p>' +
    '  </body>' +
    '</html>';

let handlers = {};

handlers['magnify'] =
    'els = document.getElementsByTagName(\'div\'); ' +
    'for (i = 0; i < els.length; i++) {' +
    '  els[i].style.fontSize = "200%";' +
    '}'

handlers['setBackground'] =
    'document.body.style.backgroundColor=\'pink\';';

handlers['addDiv'] =
    'el = document.createElement(\'div\'); ' +
    'el.innerText = \'Greetings from the extension!\'; ' +
    'document.body.appendChild(el);';

handlers['iFrameDataURL'] =
    'el = document.createElement(\'iframe\');\n' +
    'document.body.appendChild(el);\n' +
    'el.src = \'' + iframeDataURL + '\';';

handlers['getInitScripts'] =
    'window.addEventListener(\'keypress\', function(e){\n' +
    '  console.log(\'keypress!!\');\n' +
    '  if (!embedder)\n' +
    '    return;\n' +
    '  if (e.keyCode == 109)\n' +
    '    embedder.postMessage(JSON.stringify({\n' +
    '      \'extensionId\' : \'' + chrome.runtime.id + '\',\n' +
    '      \'request\' : \'magnify\'}), \'*\');\n' +
    '});';

chrome.runtime.onConnectExternal.addListener(function(port) {
  port.onMessage.addListener((msg) => {
    if (!handlers.hasOwnProperty(msg.request)) {
      console.error('Unknown request: ' + msg.request);
      return;
    }
    port.postMessage({code: handlers[msg.request], name: 'ext_' + msg.request});
  });
});
