chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    'innerBounds': {
      'width': 635,
      'height': 370,
      'minWidth': 635,
      'minHeight': 370,
      'left': 100,
      'top': 100
    }
  });
});
