chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 640,
    height: 480
  });
});
