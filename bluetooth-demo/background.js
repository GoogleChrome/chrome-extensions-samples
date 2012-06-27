chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('index.html', {
    width: 680,
    height: 480
  });
});
