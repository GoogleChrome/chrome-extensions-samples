var wind = null ,requestingWindow = null;
var fs = null;

function onWindowLoaded() {
  wind = this;
  if (fs) {
    this.onCreatedFileSystem(fs);
  } else {
    requestingWindow = wind;
  }
}

chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create("index.html", {
    resizable: false,
    frame: 'none',
    id: "index",
    innerBounds: {
      width: 640,
      height: 635
    }
  }, function(newWindow) {
    if (newWindow.contentWindow != wind) {
      newWindow.contentWindow.onload = onWindowLoaded;
      newWindow.onClosed.addListener(function() {
        wind = null;
      });
    }
  });
});

chrome.syncFileSystem.requestFileSystem(function(syncFS) {
  fs = syncFS;
  if (requestingWindow) {
    requestingWindow.onCreatedFileSystem(fs);
  }
});
