chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html',
                           {'id': 'ChromeInAppPaymentSample',
                            'defaultWidth': 900, 'defaultHeight': 500},
                           function(win) {
    console.log(win);
  });
});
