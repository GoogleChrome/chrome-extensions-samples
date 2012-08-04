chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    width: 300,
    height: 600
  });
});
