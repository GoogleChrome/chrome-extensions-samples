/**
 * Listens for the app launching then creates the window
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
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
