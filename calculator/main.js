chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('calculator.html', {
    width: 250, 
    height: 380,
  });
});
