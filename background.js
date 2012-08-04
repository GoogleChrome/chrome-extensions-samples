chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 700,
    height: 600
  });
});

chrome.runtime.onInstalled.addListener(function() { 
  chrome.storage.local.set({});
});

// for Window API sample:
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
