chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('weather.html', {
  	frame: 'none',
    height: 450,
    minHeight: 450,
    minWidth: 300,
    maxHeight: 450,
    maxWidth: 300,
    width: 300,
  });
});
