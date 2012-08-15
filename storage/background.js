chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    'width': 400,
    'height': 500
  });
});
