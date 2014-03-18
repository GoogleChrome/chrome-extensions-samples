chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    id: "MainWindow",
    innerBounds: {
      width: 1000,
      height: 600
    }
  });
});
