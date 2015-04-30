chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
	id: "mainwin",
    innerBounds: {
      'width': 400,
      'height': 500
    }
  });
});
