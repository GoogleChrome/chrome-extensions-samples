chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('permissions.html', {
    id: 'permissions',
    width: 640,
    height: 480
  });
})
