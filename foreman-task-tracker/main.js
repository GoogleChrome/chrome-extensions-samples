chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'height': 550,
    'width': 400,
  });
});
