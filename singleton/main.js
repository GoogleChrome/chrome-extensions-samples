var singletonWindow;

chrome.experimental.app.onLaunched.addListener(function() {
  if (singletonWindow && !singletonWindow.closed) {
    console.log('Focusing singleton window');
    singletonWindow.chrome.app.window.focus();
  } else {
    console.log('Creating singleton window');
    chrome.app.window.create('singleton.html', {
      width: 500,
      height: 309,

      maxWidth: 500,
      maxHeight: 309,

      minWidth: 500,
      minHeight: 309
    }, function(w) {
      singletonWindow = w;
    });
  }
});
