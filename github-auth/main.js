chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', 
    { "bounds": { "width": 400, "height": 300 },
      "id": "index"
    });
});
