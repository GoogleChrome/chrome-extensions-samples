chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('main.html', {
    width: 300,
    height: 600
  });
});
