var main = null;
chrome.experimental.app.onLaunched.addListener(function(data) {
  if (main) {
    main.focus();
  } else {
    chrome.appWindow.create('index.html', {
      width: 700,
      height: 473,
      minWidth: 700,
      minHeight: 473,
      type: 'none'
    }, function(win) {
      main = win;
      if (data && data.intent && data.intent.type.indexOf('image') === 0)
        win.webkitIntent = data.intent || null;
    });
  }
});
