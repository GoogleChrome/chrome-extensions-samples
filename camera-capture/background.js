chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 700,
    height: 600,
    type: 'panel'
  });
});
