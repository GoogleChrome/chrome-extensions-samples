chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "control-panel.html",
      {
        innerBounds: { width: 1060, height: 510, minWidth: 1060 }
      });
});

