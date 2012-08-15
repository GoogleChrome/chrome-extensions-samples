chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    width: 300,
    height: 600
  });
});
