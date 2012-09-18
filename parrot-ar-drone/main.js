chrome.app.runtime.onLaunched.addListener(function() {

  var isAliveCheck = 0,
      appWindow = null;

  isAliveCheck = setInterval(function() {
    if(appWindow) {
      if(appWindow.closed && appWindow.DRONE) {
        appWindow.DRONE.API.shutdown();
      }
    }
  }, 1000);

  chrome.app.window.create('index.html', {
    width: 565,
    height: 400
  }, function(createdWindow) {
    appWindow = createdWindow.dom;
  });

});
