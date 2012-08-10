chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('weather.html', {
    width: 210,
    height: 280,
  });
});