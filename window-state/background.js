chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
  	id: "mainwin",
    bounds: {
      width: 700,
      height: 600
    }
  });
});
