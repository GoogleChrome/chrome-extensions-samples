// Copyright (c) 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', function() {

  var deleteNode = function(node) {
    node.parentNode.removeChild(node);
  };

  var deleteAWebview = function() {
    deleteNode(document.querySelector('.ib'));
  };

  var findContainer = function(node) {
    var container = node;
    while (container && !container.classList.contains('ib')) {
      container = container.parentElement;
    }
    return container;
  };

  var handleDelete = function(event) {
    var container = findContainer(event.target);
    if (container) {
      deleteNode(container);
    }
  };

  var viewScreenshot = function(wv) {
    return function(data) {
      chrome.app.window.create('display.html', {
        innerBounds: { width: wv.clientWidth, height: wv.clientHeight }
      },
      function(aw) {
        var d = aw.contentWindow.document;
        d.addEventListener('DOMContentLoaded', function() {
          var img = d.createElement('img');
          img.src = data;
          d.body.appendChild(img);
        });
      });
    };
  };

  var handleScreenshot = function(event) {
    var container = findContainer(event.target);
    var wv = container.querySelector('webview');
    wv.captureVisibleRegion({format:'png'}, viewScreenshot(wv));
  };

  var getControls = (function() {
    var controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = '<button id="screenshot">Screenshot</button>' +
        '<button id="delete">Delete webview</button>';

    return function() {
      var c = controls.cloneNode(true);
      c.querySelector('#delete').addEventListener('click', handleDelete);
      c.querySelector('#screenshot').
          addEventListener('click', handleScreenshot);
      return c;
    };
  })();

  var createWebview = (function(){
    var id = 0;
    return function() {
      var wv = document.createElement('webview');
      wv.partition = "partition";
      wv.src = 'test2.html';
      wv.allowtransparency = document.getElementById('transparent').checked;
      wv.style.width = "640px";
      wv.style.height = "480px";

      var container = document.createElement('div');
      container.id = 'wvid0' + id;
      id++;

      container.className = 'ib';

      container.appendChild(wv);
      container.appendChild(getControls());
      return container;
    };
  })();

  document.getElementById('delete_wv').
      addEventListener('click', deleteAWebview);
  document.getElementById('add_wv').
      addEventListener('click', function() {
        document.body.appendChild(createWebview());
      });
});
