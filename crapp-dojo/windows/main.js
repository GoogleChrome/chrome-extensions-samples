var windows = [];
var updateInterval;

/**
 * Resets the windows and removes
 * any interval that is running
 */
function reset() {

  if (updateInterval) {
    clearInterval(updateInterval);
  }

  windows.forEach( function (w) {
    w.close();
  } );

  windows.length = 0;
}

/**
 * Initialise and launch the windows
 */
function launch() {

  // reset everything
  reset();

  // create the original window
  chrome.app.window.create('original.html', {
      top: 128,
      left: 128,
      width: 300,
      height: 300,
      minHeight: 300,
      maxWidth: 500,
      minWidth: 300
    },

    // when that is created store it
    // and create the copycat window
    function(originalWindow) {

      windows.push(originalWindow);

      chrome.app.window.create('copycat.html', {
        top: 128,
        left: 428 + 5,
        width: 300,
        height: 300,
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
        updateInterval = setInterval(function() {
          if (originalWindow.closed || copycatWindow.closed) {
            reset();
            return;
          }

          copycatWindow.moveTo(
              originalWindow.screenX + originalWindow.outerWidth + 5,
              originalWindow.screenY);
          copycatWindow.resizeTo(
              originalWindow.outerWidth,
              originalWindow.outerHeight);
        }, 10);

        originalWindow.chrome.app.window.focus();

      });
  });
}

/**
 * Minimises both the original and copycat windows
 */
function minimizeAll() {

  windows.forEach( function (w) {
    w.chrome.app.window.minimize();
  });

  // sets a timeout to kill the windows
  // if the user minimises them
  setTimeout(reset, 2000);
}

chrome.experimental.app.onLaunched.addListener(launch);
