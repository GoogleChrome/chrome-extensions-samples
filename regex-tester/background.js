chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('main.html', {
    'frame': 'chrome',
    'width': 512, 'height': 384
  });
});
