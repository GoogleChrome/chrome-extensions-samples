/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/experimental.app.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function(data) {
  // App Launched
  chrome.app.window.create('index.html',
    { id: 'main',
      bounds: {width: 1030, height: 704}
    });
});
