chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create("window.html", {bounds: {width:600, height:400}});
});
