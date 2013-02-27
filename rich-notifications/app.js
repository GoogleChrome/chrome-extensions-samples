chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create("window.html", {width:600, height:400});
});