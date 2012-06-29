function onLaunched(launchData) {
  chrome.appWindow.create('editor.html', function(win) {
    win.launchData = launchData;
  });
}

chrome.experimental.app.onLaunched.addListener(onLaunched)
