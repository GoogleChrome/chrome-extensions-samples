var singletonWindow;

chrome.experimental.app.onLaunched.addListener(function() {
  if (singletonWindow && !singletonWindow.closed) {
    console.log('Focusing singleton window');
    singletonWindow.chrome.app.window.focus();
  } else {
    console.log('Creating singleton window');
    chrome.app.window.create('singleton.html', {}, function(w) {
      singletonWindow = w;
    });
  }
});
