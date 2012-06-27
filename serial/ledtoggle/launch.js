chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('index.html', {
    width: 320,
    height: 240
  });
});
