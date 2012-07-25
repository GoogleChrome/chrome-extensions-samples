/**
 * 
 * Mini Code Edit is designed to run on a Chrome OS device. It uses the
 * fileBrowserHandler API (http://code.google.com/chrome/extensions/fileBrowserHandler.html),
 * which is available only on Chrome OS. If that API isn't available, it uses the
 * chrome.fileSystem API, which isn't quite yet available on Chrome OS.
 *
 */

// width 640 for font size 12
//       720 for font size 14
chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    frame: 'chrome', width: 720, height: 400
  });
});
