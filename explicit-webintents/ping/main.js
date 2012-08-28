var appWindow;

chrome.app.runtime.onLaunched.addListener(function(launchData) {
  if (appWindow && !appWindow.closed) {
    if (launchData && launchData.intent) {
      appWindow.handleIntent(launchData.intent);
    }
  } else {
    chrome.app.window.create('window.html', {
      width: 300,
      height: 300,
      top: 64,
      left: 32
    }, function(w) {
      appWindow = w;
      appWindow.launchData = launchData;
    });
  }
});