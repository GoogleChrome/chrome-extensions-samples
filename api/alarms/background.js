chrome.runtime.onInstalled.addListener((_reason) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});
