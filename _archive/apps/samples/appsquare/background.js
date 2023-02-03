chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
  	id: "appSquareID",
    innerBounds: {
      width: 300,
      height: 600
    }
  });
});
