chrome.app.runtime.onLaunched.addListener(function (launchData) {
  chrome.app.window.create('editor.html', function(win) {
    win.contentWindow.launchData = launchData;
  });
});
