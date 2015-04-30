var blink1 = undefined;

function onAppWindowClosed() {
  if (blink1) {
    blink1.disconnect();
  }
  window.close();
}

function onAppWindowCreated(appWindow) {
  appWindow.onClosed.addListener(onAppWindowClosed);
}

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "color-picker.html", {
        id: "blink1",
        innerBounds: { width: 160, height: 115 },
        resizable: false
      }, onAppWindowCreated);
});
