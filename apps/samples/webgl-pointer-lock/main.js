/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    {
    	id: "mainwin",
    	frame:"none", 
    	innerBounds: {width: 500, height: 400}
    });
});
