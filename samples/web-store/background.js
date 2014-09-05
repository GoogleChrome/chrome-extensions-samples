chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    { 
      "id": "mainWindow",
      "resizable": false,
      "bounds": { "width": 360, "height": 540 }
    });
});
