chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('browser.html', {
    'width': 1024,
    'height': 768
  });
});
