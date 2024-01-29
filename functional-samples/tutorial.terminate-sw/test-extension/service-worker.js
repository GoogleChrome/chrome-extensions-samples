chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendResponse('pong');
});
