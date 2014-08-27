chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html',
                           {'id': 'test',
                            'defaultWidth': 800, 'defaultHeight': 600},
                           function(win) {
    console.log(win);
  });
});
