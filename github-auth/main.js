chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', { "width": 400, "height": 200 });
});
