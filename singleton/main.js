var singletonWindow;

chrome.experimental.app.onLaunched.addListener(function() {
  if (singletonWindow && !singletonWindow.closed) {
    console.log('Focusing singleton window');
    singletonWindow.focus();
  } else {
    console.log('Creating singleton window');
    chrome.appWindow.create('singleton.html', {}, function(w) {
      singletonWindow = w;
    });
  }
});
