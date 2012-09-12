var mainWindow = null;
chrome.app.runtime.onLaunched.addListener(function(data) {
  if (mainWindow && !mainWindow.dom.closed) {
    mainWindow.focus();
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
        win.dom.webkitIntent = data.intent || null;
    });
  }
});
