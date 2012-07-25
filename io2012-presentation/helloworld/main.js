chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    width: 400,
    height: 400
  });
});
