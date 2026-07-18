let data;

chrome.runtime.onInstalled.addListener(() => {
  data = { version: chrome.runtime.getManifest().version };
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendResponse(data.version);
});
