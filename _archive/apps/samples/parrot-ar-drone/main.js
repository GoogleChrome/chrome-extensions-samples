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
    id: "mainwin", 
    innerBounds: {
      width: 600,
      height: 800
    }
  }, function(createdWindow) {
    appWindow = createdWindow.dom;
  });

});
