/**
 * Listens for the app launching then creates the window
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_runtime
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    {
    	id: "mainwin",
    	frame:"none", 
    	innerBounds: {width: 500, height: 400}
    });
});
