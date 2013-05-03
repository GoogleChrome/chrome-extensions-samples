chrome.app.runtime.onLaunched.addListener(function() {

  var isAliveCheck = 0,
      appWindow = null;

  isAliveCheck = setInterval(function() {
    if(appWindow && appWindow.closed && appWindow.DRONE) {
      appWindow.DRONE.API.shutdown();
      appWindow=null;
      if (isAliveCheck) clearInterval(isAliveCheck);
    }
  }, 1000);

  chrome.app.window.create('index.html', {
    bounds: {
      width: 565,
      height: 400
    }
  }, function(createdWindow) {
    appWindow = createdWindow.dom;
  });

});
