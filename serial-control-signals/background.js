chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('main.html', {
    top: 0,
    left: 0,
    width: 640,
    height: 720
  });
})
