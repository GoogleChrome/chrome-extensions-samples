chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('index.html', {
    width: 700,
    height: 600,
    type: 'panel'
  });
});
