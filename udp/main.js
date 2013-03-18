chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('echo_mco.html', {
    bounds: {
      width: 680,
      height: 480
    }
  });
});
