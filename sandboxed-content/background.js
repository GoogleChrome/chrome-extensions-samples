chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    'width': 400,
    'height': 400,
    'left': 0,
    'top': 0
  });

  chrome.app.window.create('sandboxed.html', {
    'width': 400,
    'height': 400,
    'left': 400,
    'top': 0
  });
});
