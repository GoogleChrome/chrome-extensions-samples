/**
 * Listens for the extension launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.runtime.onStartup.addListener(function() {
  chrome.windows.create('index.html', {
    id: "desktopCaptureID",
    innerBounds: {
      width: 700,
      height: 600
    }
  });
});
