chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('terminal.html', {
    width: 680,
    height: 480
  });
});
