chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('index.html', {id:"fileWin", innerBounds: {width: 800, height: 500}}, function(win) {
    win.contentWindow.launchData = launchData;
  });
});
