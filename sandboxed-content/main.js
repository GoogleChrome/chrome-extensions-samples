chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    'width': 400,
    'height': 400
  });
});
