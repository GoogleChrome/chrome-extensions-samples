chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('a.html', {top: 0, left: 0, width: 300, height: 300});
  chrome.appWindow.create('b.html', {top: 0, left: 310, width: 300, height: 300});
});
