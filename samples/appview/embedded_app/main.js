chrome.app.runtime.onEmbedRequested.addListener(function(request) {
  if (!request.data.message) {
    request.allow('default.html');
  } else if (request.data.message == 'camera') {
    request.allow('camera.html');
  } else {
    request.deny();
  }
});
