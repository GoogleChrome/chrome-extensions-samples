chrome.runtime.onInstalled.addListener((_reason) => {
  chrome.tabs.create({
    url: 'index.html'
  });
});
