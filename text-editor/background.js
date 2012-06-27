function onLaunched(launchData) {
  chrome.appWindow.create('demo.html', function(win) {
    win.launchData = launchData;
  });
}

chrome.experimental.app.onLaunched.addListener(onLaunched)
