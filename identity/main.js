chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', { "width": 1024, "height": 768 });
});
