chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendResponse(chrome.runtime.getManifest().version);
});
