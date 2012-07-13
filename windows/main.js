var windows = [];
var updateInterval;

function clear() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  windows.forEach(function(w) {w.close()});
  windows = [];
}

function launch() {
  clear();
  chrome.appWindow.create('original.html', {
    top: 128,
    left: 128,
    width: 256,
    height: 256,
    maxWidth: 256,
    minWidth: 256
  }, function(originalWindow) {
    windows.push(originalWindow);
    chrome.appWindow.create('copycat.html', {
      top: 128,
      left: 384 + 5,
      width: 256,
      height: 256,
      maxWidth: 256,
      minWidth: 256,
      frame: 'none'
    }, function(copycatWindow) {
      windows.push(copycatWindow);

      updateInterval = setInterval(function() {
        if (originalWindow.closed || copycatWindow.closed) {
          clear();
          return;
        }

        copycatWindow.moveTo(
            originalWindow.screenX + originalWindow.outerWidth + 5,
            originalWindow.screenY);
        copycatWindow.resizeTo(
            originalWindow.outerWidth,
            originalWindow.outerHeight);
      }, 10);

      originalWindow.chrome.appWindow.focus();
    });
  });
}

function minimizeAll() {
  windows.forEach(function(w) {w.chrome.appWindow.minimize()});
  setTimeout(clear, 2000);
}

chrome.experimental.app.onLaunched.addListener(launch);
