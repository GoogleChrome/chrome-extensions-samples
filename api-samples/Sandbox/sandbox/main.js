/**
 * Listens for the extension launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.runtime.onStartup.addListener(function() {
  console.log("started the function");
  chrome.windows.create(
    {
    	url: 'mainpage.html',
    });
    console.log("made the window");
});
