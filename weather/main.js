chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('weather.html', {
    height: 280,
    minHeight: 280,
    minWidth: 210,
    maxHeight: 280,
    maxWidth: 210,
    width: 210,
  });
});