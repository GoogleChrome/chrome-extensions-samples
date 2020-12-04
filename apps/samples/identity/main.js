chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    { "id": "identitywin",
      "innerBounds": {
        "width": 454,
        "height": 540
      }
    });
});
