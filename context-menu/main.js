chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('a.html', {bounds:{top: 0, left: 0, width: 300, height: 300}});
  chrome.app.window.create('b.html', {bounds:{top: 0, left: 310, width: 300, height: 300}});
});
