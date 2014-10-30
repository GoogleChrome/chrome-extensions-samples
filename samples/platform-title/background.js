var platformInfo = {};

chrome.app.runtime.onLaunched.addListener(function() {

  // Load platformInfo before continuing.
  chrome.runtime.getPlatformInfo(function(info) {
    platformInfo = info;

    chrome.app.window.create('main.html', {
      id: 'main',
      frame: 'none',
      // alphaEnabled: true,
      innerBounds: {
        width: 880,
        height: 480
      }
    });
  });
});
