chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('index.html', { "width": 1024, "height": 768 });
});
