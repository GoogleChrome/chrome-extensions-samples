chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('calculator.html', {
    width: 217, height: 223
  });
});
