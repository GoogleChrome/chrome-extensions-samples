chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    "id": "One-Time-Payment-Demo",
    "innerBounds": {
      "width": 640,
      "height": 310,
      "minWidth": 640,
      "minHeight": 310
    }
  });
});
