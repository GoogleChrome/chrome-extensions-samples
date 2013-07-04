"use strict";

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('../html/window.html', {
      'id': 'main-view',
    'width': 450,
    'height': 500,
    'minWidth': 450,
    'minHeight': 500
  });
});
