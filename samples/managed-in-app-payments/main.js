chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    "id": "ManagedInAppPaymentsDemo",
    "bounds": {
      "width": 680,
      "height": 480
    },
    "minWidth": 650
  });
});
