var PRESENTATION_WIDTH = 900;
var PRESENTATION_HEIGHT = 700;

var presentationWindow;

chrome.app.runtime.onLaunched.addListener(function() {
  if (presentationWindow && !presentationWindow.contentWindow.closed) {
    presentationWindow.focus();
    return;
  }

  var left = Math.max((screen.width - PRESENTATION_WIDTH)/2, 0);
  var top = Math.max((screen.height - PRESENTATION_HEIGHT)/2, 0);

  chrome.app.window.create('presentation.html?presentme=true', {
      frame: 'chrome',
      innerBounds: {
        left: left, top: top,
        width: PRESENTATION_WIDTH, height: PRESENTATION_HEIGHT,
        minWidth: PRESENTATION_WIDTH, minHeight: PRESENTATION_HEIGHT,
        maxWidth: PRESENTATION_WIDTH, maxHeight: PRESENTATION_HEIGHT
      }
  }, function(w) {
    presentationWindow = w;
  });
});


var windowingApiDemo = {
  windows: [],

  clear: function() {
    if (windowingApiDemo.updateInterval) {
      clearInterval(windowingApiDemo.updateInterval);
    }

    windowingApiDemo.windows.forEach(function(w) {w.contentWindow.close()});
    windowingApiDemo.windows = [];
  },

  launch: function() {
    windowingApiDemo.clear();
    chrome.app.window.create('windowing_api/original.html', {
      outerBounds: {
        top: 128,
        left: 128,
        width: 256,
        height: 256
      }
    }, function(originalWindow) {

      windowingApiDemo.windows.push(originalWindow);
      chrome.app.window.create('windowing_api/copycat.html', {
        outerBounds: {
          top: 128,
          left: 384 + 5,
          width: 256,
          height: 256,
        },
        frame: 'none'
      }, function(copycatWindow) {
        windowingApiDemo.windows.push(copycatWindow);

        windowingApiDemo.updateInterval = setInterval(function() {
          if (originalWindow.contentWindow.closed || copycatWindow.contentWindow.closed) {
            windowingApiDemo.clear();
            return;
          }

          copycatWindow.outerBounds.left = originalWindow.contentWindow.screenX + originalWindow.contentWindow.outerWidth + 5;
          copycatWindow.outerBounds.top = originalWindow.contentWindow.screenY;
          copycatWindow.outerBounds.width = originalWindow.contentWindow.outerWidth;
          copycatWindow.outerBounds.height = originalWindow.contentWindow.outerHeight;

        }, 10);

        originalWindow.focus();
      });
    });
  },

  minimizeAll: function() {
    windowingApiDemo.windows.forEach(function(w) { w.minimize() });
    setTimeout(windowingApiDemo.clear, 2000);
  }
}
