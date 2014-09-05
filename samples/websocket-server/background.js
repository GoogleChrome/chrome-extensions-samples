chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    innerBounds: {
      width: 800,
      height: 600,
      minWidth: 200,
      minHeight: 200,
    }
  });
});
