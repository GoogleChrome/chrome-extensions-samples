chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 640,
    height: 480
  });
});
