chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('main.html', {
    width: 680,
    height: 480
  });
});
