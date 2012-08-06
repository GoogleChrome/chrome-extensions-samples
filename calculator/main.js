chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('calculator.html', {
    width: 244,
    height: 380,
    maxWidth: 244,
    minWidth: 244,
    minHeight: 380
  });
});
