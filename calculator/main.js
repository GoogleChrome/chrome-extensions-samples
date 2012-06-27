chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('calculator.html', {
    width: 217, height: 223
  });
});
