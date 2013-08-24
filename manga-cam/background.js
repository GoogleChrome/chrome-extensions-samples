chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create("assets/index.html", {
    singleton: true,
    resizable: false,
    frame: 'none',
    id: "index",
    width: 640,
    height: 625
  })
});
