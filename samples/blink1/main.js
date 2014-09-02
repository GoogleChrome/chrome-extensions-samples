chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "color-picker.html", {
        innerBounds: { width: 160, height: 94, minWidth: 160 }
      });
});

