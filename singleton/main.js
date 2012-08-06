var singletonWindow;

/**
 * Listens and launches the window, using a reference
 * to determine if a window already exists. If it does
 * that window is focused, otherwise a new window
 * is created and the reference stored for next time.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 * @see http://developer.chrome.com/trunk/apps/experimental.app.html
 */
chrome.experimental.app.onLaunched.addListener(function() {
  if (singletonWindow && !singletonWindow.closed) {
    console.log('Focusing singleton window');
    singletonWindow.chrome.app.window.focus();
  } else {
    console.log('Creating singleton window');
    chrome.app.window.create('singleton.html', {
      width: 500,
      height: 309,

      maxWidth: 500,
      maxHeight: 309,

      minWidth: 500,
      minHeight: 309
    }, function(w) {
      singletonWindow = w;
    });
  }
});
