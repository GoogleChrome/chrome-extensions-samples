chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('permissions.html', {
    id: 'permissions',
    bounds: {
      width: 640,
      height: 480
    }
  });
})
