/**
 * Listens for the app launching then creates the window
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_runtime
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
chrome.app.runtime.onLaunched.addListener(function() {
  runApp();
});

/**
 * Listens for the app restarting then re-creates the window.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_runtime
 */
chrome.app.runtime.onRestarted.addListener(function() {
  runApp();
});

/**
 * Creates the window for the application.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
function runApp() {
  chrome.app.window.create('browser.html', {
  	id: "browserWinID",
    innerBounds: {
      'width': 1024,
      'height': 768
    }
  });
}
