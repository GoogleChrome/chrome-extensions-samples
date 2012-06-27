chrome.experimental.app.onLaunched.addListener(function(launchData) {
  chrome.appWindow.create('index.html', {width: 800, height: 600}, function(win) {
  	win.launchData = launchData;
  });
});
