var appWindow;

chrome.app.runtime.onLaunched.addListener(function(launchData) {
  if (appWindow && !appWindow.closed) {
    appWindow.chrome.app.window.focus();
    if (launchData && launchData.intent) {
      appWindow.handleIntent(launchData.intent);
    }
  } else {
    chrome.app.window.create('window.html', {
      width: 400,
      height: 400
    }, function(w) {
      appWindow = w;
      appWindow.launchData = launchData;
    });
  }
});