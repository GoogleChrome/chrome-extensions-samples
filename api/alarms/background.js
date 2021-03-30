// Open the extension's demo page on install/update
chrome.runtime.onInstalled.addListener((_reason) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

chrome.alarms.create('demo-default-alarm', {
  delayInMinutes: 1,
  periodInMinutes: 1,
});
