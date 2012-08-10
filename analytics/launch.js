/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/experimental.app.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('main.html',
    {width: 480, height: 225});
});
