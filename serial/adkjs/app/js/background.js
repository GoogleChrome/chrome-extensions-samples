
chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('comm.html#inlink', 
     {frame: 'custom', width: 343, height: 600});
});
