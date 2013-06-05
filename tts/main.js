/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  runApp();
});

/**
 * Listens for the app restarting then re-creates the window.
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 */
chrome.app.runtime.onRestarted.addListener(function() {
  runApp();
});

/**
 * Creates the window for the application.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
function runApp() {
  	var screenWidth = screen.availWidth;
  	var screenHeight = screen.availHeight;
  	var width = 500;
    var height = 300;
  
  var win = chrome.app.window.create('ttsdemo.html', {
   
   bounds: {
   	  'width': 1024,
      'height': 768
    }
  });

  //win.maximize(function(){});

}
