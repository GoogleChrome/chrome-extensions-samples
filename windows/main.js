var windows = [];

/**
 * Resets the windows and removes
 * any interval that is running
 */
function reset() {

  windows.forEach( function (w) {
    w.contentWindow.close();
  } );

  windows.length = 0;
}

/**
 * Initialise and launch the windows
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
function launch() {

  // reset everything
  reset();

  // create the original window
  chrome.app.window.create('original.html', {
      bounds: {
        top: 128,
        left: 128,
        width: 300,
        height: 300
      },
      minHeight: 300,
      maxWidth: 500,
      minWidth: 300,
      frame: 'none'
    },

    // when that is created store it
    // and create the copycat window
    function(originalWindow) {

      windows.push(originalWindow);

      chrome.app.window.create('copycat.html', {
        bounds: {
          top: 128,
          left: 428 + 5,
          width: 300,
          height: 300
        },
        minHeight: 300,
        maxWidth: 500,
        minWidth: 300,
        frame: 'none'
      },

      function(copycatWindow) {

        // store the copycat
        windows.push(copycatWindow);

        // now have the copycat watch the
        // original window for changes
        originalWindow.onMinimized.addListener(minimizeAll);
        originalWindow.onClosed.addListener(reset);
        copycatWindow.onClosed.addListener(reset);

        originalWindow.onBoundsChanged.addListener(function() {
          var bounds = originalWindow.getBounds();
          bounds.left = bounds.left + bounds.width + 5;
          copycatWindow.setBounds(bounds);
        });

        originalWindow.focus();

      });
  });
}

/**
 * Minimises both the original and copycat windows
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
function minimizeAll() {

  windows.forEach( function (w) {
    w.minimize();
  });

  // sets a timeout to kill the windows
  // if the user minimises them
  setTimeout(reset, 2000);
}

// @see http://developer.chrome.com/trunk/apps/app.runtime.html
chrome.app.runtime.onLaunched.addListener(launch);
