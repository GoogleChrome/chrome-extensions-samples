chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
  	id: "appSquareID",
    bounds: {
      width: 300,
      height: 600
    }
  });
});
