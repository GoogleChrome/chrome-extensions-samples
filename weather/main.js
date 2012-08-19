chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('weather.html', { frame: "none",
    height: 290,
    minHeight: 290,
    minWidth: 210,
    maxHeight: 290,
    maxWidth: 210,
    width: 210,
  });
});
