chrome.app.runtime.onLaunched.addListener(function (arg) {
  chrome.app.window.create(
    'main.html',
    { 
    	id: "mainwin",
    	innerBounds: { width:780, height:490}
    });
});
