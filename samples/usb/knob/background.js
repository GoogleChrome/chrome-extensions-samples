chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('knob.html', {
    innerBounds: {
      width: 400,
      height: 400
    },
    id: "ChromeApps-Sample-USB-Knob"
  });
});
