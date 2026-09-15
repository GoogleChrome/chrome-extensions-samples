chrome.action.onClicked.addListener(function (tab) {
  if (tab.url.startsWith('http')) {
    chrome.debugger.attach({ tabId: tab.id }, '1.2', function () {
      // Enable Fetch interception with URL patterns restricted to http/https only.
      // This prevents the error: "Cannot access a chrome-extension:// URL of different extension."
      // The patterns array ensures only web requests (http/https) are intercepted,
      // not chrome-extension:// URLs which are restricted by browser security.
      chrome.debugger.sendCommand(
        { tabId: tab.id },
        'Fetch.enable',
        {
          patterns: [
            { urlPattern: 'http://*' },
            { urlPattern: 'https://*' }
          ]
        },
        function () {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          }
        }
      );
    });
  } else {
    console.log('Debugger can only be attached to HTTP/HTTPS pages.');
  }
});

chrome.debugger.onEvent.addListener(function (source, method, params) {
  // Handle Fetch.requestPaused events from the restricted Fetch.enable patterns.
  // Only http/https requests will trigger this, preventing chrome-extension:// errors.
  if (method === 'Fetch.requestPaused') {
    console.log('Request paused:', params.request.url);
    // Perform your desired action with the request data
  }
});
