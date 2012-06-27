chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('knob.html', {
    width: 400,
    height: 400
  });
});
