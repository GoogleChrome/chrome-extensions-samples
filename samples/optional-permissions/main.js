chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('permissions.html', {
    id: 'permissions',
    innerBounds: {
      width: 640,
      height: 480
    }
  });
})
