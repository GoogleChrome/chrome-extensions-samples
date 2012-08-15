chrome.app.runtime.onLaunched.addListener(function() {
  var w = chrome.appWindow || chrome.app.window;
  w.create('main.html', {
    type: 'shell',
    width: 440,
    minWidth: 440,
    minHeight: 200,
  });
});
