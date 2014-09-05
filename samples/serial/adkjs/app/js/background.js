chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('comm.html#inlink',
     {
     	frame: 'custom', 
     	id: "mainwin",
     	innerBounds: {width: 343, height: 600}
     });
});
