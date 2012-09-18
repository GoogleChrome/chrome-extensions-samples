chrome.app.runtime.onLaunched.addListener(function() {
  var w = chrome.appWindow || chrome.app.window;
  w.create('main.html', {
    frame: 'none',
    width: 440,
    minWidth: 440,
    minHeight: 200,
  });
});
