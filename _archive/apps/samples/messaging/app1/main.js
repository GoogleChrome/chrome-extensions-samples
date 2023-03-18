/**
 * Listens for the app launching then creates the window
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_runtime
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html',
    {
    	id: "messagingEx1ID",
    	innerBounds: {width: 800, height: 500}
    });
});
//function addExternalMessageListener
