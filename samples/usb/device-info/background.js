chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    bounds: {
      width: 670,
      height: 350
    },
    singleton: true,
    id: "ChromeApps-Sample-USB-DeviceInfo"
  });
});
