chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    'frame': 'chrome',
    'width': 512, 'height': 384
  });
});
