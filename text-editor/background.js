function onLaunched(launchData) {
  chrome.app.window.create('editor.html', function(win) {
    win.launchData = launchData;
  });
}

chrome.experimental.app.onLaunched.addListener(onLaunched)
