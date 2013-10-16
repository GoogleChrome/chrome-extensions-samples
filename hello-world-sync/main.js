chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
  	id: "helloWorldSyncID",
    bounds: {
      width: 500,
      height: 415
    }
  });
});
