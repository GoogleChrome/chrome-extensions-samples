chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
  	id: "helloWorldSyncID",
    innerBounds: {
      width: 500,
      height: 415
    }
  });
});
