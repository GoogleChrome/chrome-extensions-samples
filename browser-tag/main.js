chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('browser.html', {
    'width': 1024,
    'height': 768
  });
});
