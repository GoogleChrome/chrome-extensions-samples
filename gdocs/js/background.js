chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('../main.html', {
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    left: 100,
    top: 100,
    type: 'shell'
  });
});

chrome.runtime.onInstalled.addListener(function() {
  console.log('installed');
});
