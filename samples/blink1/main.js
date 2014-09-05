var blink1 = undefined;

function onAppWindowClosed() {
  if (!blink1) {
    window.close();
    return;
  }

  blink1.disconnect(function(success) {
    if (success) {
      console.log("Blink1 disconnected.");
    }
    window.close();
  });
}

function onAppWindowCreated(appWindow) {
  appWindow.onClosed.addListener(onAppWindowClosed);
}

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create(
      "color-picker.html", {
        id: "blink1",
        innerBounds: { width: 160, height: 94 },
        resizable: false
      }, onAppWindowCreated);
});

