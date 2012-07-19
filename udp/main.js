chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('echo_mco.html', {
    width: 680,
    height: 480
  });
});
