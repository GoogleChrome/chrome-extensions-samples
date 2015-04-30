chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
  	id: "mainwin",
    innerBounds: {
      width: 700,
      height: 600
    }
  });
});
