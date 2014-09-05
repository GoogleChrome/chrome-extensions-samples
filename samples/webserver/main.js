/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function(intentData) {
  chrome.app.window.create('index.html', {
  	id: "mainwin",
    innerBounds: {
      width: 500,
      height: 640
    }
  });
});
