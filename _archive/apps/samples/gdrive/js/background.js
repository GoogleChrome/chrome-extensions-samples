chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('../main.html', {
    id: "GDriveExample",
    innerBounds: {
      width: 500,
      height: 600,
      minWidth: 500,
      minHeight: 600
    },
    frame: 'none'
  });
});

chrome.runtime.onInstalled.addListener(function() {
  console.log('installed');
});

chrome.runtime.onSuspend.addListener(function() { 
  // Do some simple clean-up tasks.
});
