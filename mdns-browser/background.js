chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    frame: 'none',
    width: 440,
    minWidth: 440,
    minHeight: 200,
  });
});
