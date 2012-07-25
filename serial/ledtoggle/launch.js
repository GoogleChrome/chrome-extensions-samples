chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 320,
    height: 240
  });
});
