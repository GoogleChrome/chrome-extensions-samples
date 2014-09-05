chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
      id: "mainwin",
      "innerBounds": { "width": 1024, "height": 768 }
  });
});
