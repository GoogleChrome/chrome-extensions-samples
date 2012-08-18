chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create(
    "frameless_window.html",
    {  width: 360,
       height: 300,
       minWidth: 220,
       minHeight: 220,
       frame: 'none'
    },
    function(win) {
      console.log(win);
    }
  );
})