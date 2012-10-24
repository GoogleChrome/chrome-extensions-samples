function runApp(startedBy, data) {
  chrome.app.window.create('main.html', {
    width: 800,
    height: 600
  }, function(win) {
    win.contentWindow.onload = function() {
      win.contentWindow.setStartedBy(startedBy);
      win.contentWindow.updateData(data);
    };
  });
}

chrome.app.runtime.onLaunched.addListener(function() {
  var data = {'clicks': 0};
  chrome.storage.local.set(data, function() {
    runApp('launched', data);
  });
});

chrome.app.runtime.onRestarted.addListener(function() {
  chrome.storage.local.get('clicks', function(data) {
    runApp('restarted', data);
  });
});
