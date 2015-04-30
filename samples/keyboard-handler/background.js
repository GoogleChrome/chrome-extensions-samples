chrome.app.runtime.onLaunched.addListener(function() {
  // Center window on screen.
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;

  var b = {
      width: Math.round(screenWidth * 2/4),
      height: Math.round(screenHeight * 2/4),
      left: Math.round(screenWidth * 1/4),
      top: Math.round(screenHeight * 1/4)
    };

  chrome.app.window.create('window.html', {
    id: "keyboardWinID",
    outerBounds: b
  });
});
