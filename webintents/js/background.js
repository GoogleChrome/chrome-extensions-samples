var mainWindow = null;
chrome.experimental.app.onLaunched.addListener(function(data) {
  if (mainWindow && !mainWindow.closed) {
    mainWindow.chrome.app.window.focus();
  } else {
    chrome.app.window.create('index.html', {
      width: 700,
      height: 473,
      minWidth: 700,
      minHeight: 473,
      type: 'none'
    }, function(win) {
      mainWindow = win;
      if (data && data.intent && data.intent.type.indexOf('image') === 0)
        win.webkitIntent = data.intent || null;
    });
  }
});
