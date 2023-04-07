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
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
function launch() {

  // reset everything
  reset();

  // create the original window
  chrome.app.window.create('original.html', {
      id: "mainwin",
      innerBounds: {
        top: 128,
        left: 128,
        width: 300,
        height: 300,
        minHeight: 300,
        maxWidth: 500,
        minWidth: 300
      },
      frame: 'none'
    },

    // when that is created store it
    // and create the copycat window
    function(originalWindow) {

      windows.push(originalWindow);

      chrome.app.window.create('copycat.html', {
        id: "copywin",
        innerBounds: {
          top: 128,
          left: 428 + 5,
          width: 300,
          height: 300,
          minHeight: 300,
          maxWidth: 500,
          minWidth: 300
        },
        frame: 'none'
      },

      function(copycatWindow) {

        // store the copycat
        windows.push(copycatWindow);

        // now have the copycat watch the
        // original window for changes
        originalWindow.onClosed.addListener(reset);
        copycatWindow.onClosed.addListener(reset);

        originalWindow.onBoundsChanged.addListener(function() {
          var bounds = originalWindow.outerBounds;
          copycatWindow.outerBounds.left = bounds.left + bounds.width + 5;
        });

        copycatWindow.onRestored.addListener(function() {
          console.log('copy restored');
          if (originalWindow.isMinimized())
            originalWindow.restore();
        })

        originalWindow.onRestored.addListener(function() {
          console.log('copy restored');
          if (copycatWindow.isMinimized())
            copycatWindow.restore();
        })

        originalWindow.focus();
      });
  });
}

/**
 * Minimises both the original and copycat windows
 * @see https://developer.chrome.com/docs/extensions/reference/app_window
 */
function minimizeAll() {

  windows.forEach( function (w) {
    w.minimize();
  });
}

// @see https://developer.chrome.com/docs/extensions/reference/app_runtime
chrome.app.runtime.onLaunched.addListener(launch);
