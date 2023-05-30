let currentReceiverTabId = null;

chrome.action.onClicked.addListener(async (tab) => {
  const currentTabId = tab.id;

  if (currentReceiverTabId) {
    await chrome.tabs.remove(currentReceiverTabId);
  }

  // Open a new tab with the receiver.html page
  const { id: receiverTabId } = await chrome.tabs.create({
    url: chrome.runtime.getURL('receiver.html')
  });
  currentReceiverTabId = receiverTabId;

  // Wait for the receiver tab to load
  await new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === receiverTabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });

  // Send a message to the receiver tab
  chrome.tabs.sendMessage(receiverTabId, {
    targetTabId: currentTabId,
    consumerTabId: receiverTabId
  });
});
