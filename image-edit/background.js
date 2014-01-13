chrome.app.runtime.onLaunched.addListener(
  function(launchData) {
    chrome.app.window.create(
      'index.html',
      { id: "window" },
      function(win) {
        win.contentWindow.launchData = launchData;
      });
  });
