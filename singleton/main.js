var singletonWindow;

/**
 * Listens and launches the window, using a reference
 * to determine if a window already exists. If it does
 * that window is focused, otherwise a new window
 * is created and the reference stored for next time.
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  if (singletonWindow && !singletonWindow.contentWindow.closed) {
    console.log('Focusing singleton window');
    singletonWindow.focus();
  } else {
    console.log('Creating singleton window');
    chrome.app.window.create('singleton.html', {
      bounds: {
        width: 500,
        height: 309
      },

      maxWidth: 500,
      maxHeight: 309,

      minWidth: 500,
      minHeight: 309
    }, function(w) {
      singletonWindow = w;
    });
  }
});
