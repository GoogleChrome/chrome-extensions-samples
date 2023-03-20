/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/experimental.app.html
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
chrome.app.runtime.onLaunched.addListener(function(data) {
  // App Launched
  chrome.app.window.create('index.html',
    { id: 'main',
      innerBounds: {width: 1030, height: 704}
    });
});
