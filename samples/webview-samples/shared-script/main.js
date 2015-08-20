/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  runApp();
});

/**
 * Listens for the app restarting then re-creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 */
chrome.app.runtime.onRestarted.addListener(function() {
  runApp();
});

/**
 * Creates the window for the application.
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
function runApp() {
  chrome.app.window.create('correct_injection.html', {'id': 'goodWindowID'},
    function(appGoodWindow) {
      var offset = 20;
      var badWindowOuterBounds = {
        'left': appGoodWindow.outerBounds.left + offset,
        'top': appGoodWindow.outerBounds.top + offset
      };
      chrome.app.window.create('incorrect_injection.html', {'id': 'badWindowID', 'outerBounds': badWindowOuterBounds});
    }
  );
}
