chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('main.html', {
    'width': 400,
    'height': 400,
    'left': 0,
    'top': 0
  });

  chrome.appWindow.create('sandboxed.html', {
    'width': 400,
    'height': 400,
    'left': 400,
    'top': 0
  });
});
