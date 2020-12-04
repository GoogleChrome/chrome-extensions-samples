chrome.app.runtime.onLaunched.addListener(function() {
  // width 640 for font size 12
  //       720 for font size 14
  chrome.app.window.create('main.html', {
    frame: 'chrome', id: "codewin", innerBounds: { width: 720, height: 400, minWidth:720, minHeight: 400 }
  });
});

/** 
* Set up the Commands listener event
* @see http://developer.chrome.com/apps/commands.html
*/
chrome.commands.onCommand.addListener(function(command) {
   console.log("Command triggered: " + command);

   if (command == "cmdNew") {
     chrome.app.window.create('main.html', {
       frame: 'chrome', id: "codewin", innerBounds: { width: 720, height: 400, minWidth:720, minHeight: 400 }
     });
   }
});
