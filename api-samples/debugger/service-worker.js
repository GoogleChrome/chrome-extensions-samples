chrome.action.onClicked.addListener(function (tab) {
  if (tab.url.startsWith('http')) {
    chrome.debugger.attach({ tabId: tab.id }, '1.2', function () {
      chrome.debugger.sendCommand(
        { tabId: tab.id },
        'Network.enable',
        {},
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
  if (method === 'Network.responseReceived') {
    console.log('Response received:', params.response);
    // Perform your desired action with the response data
  }
});
