chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('window.html', {
    width: 400,
    height: 400
  });
});
