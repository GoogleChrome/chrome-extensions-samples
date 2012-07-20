chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('terminal.html', {
    width: 680,
    height: 480
  });
});
