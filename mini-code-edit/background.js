chrome.app.runtime.onLaunched.addListener(function() {
  // width 640 for font size 12
  //       720 for font size 14
  chrome.app.window.create('main.html', {
    frame: 'chrome', width: 720, height: 400
  });
});
