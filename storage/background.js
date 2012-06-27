chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('main.html', {
    'width': 400,
    'height': 500
  });
});
