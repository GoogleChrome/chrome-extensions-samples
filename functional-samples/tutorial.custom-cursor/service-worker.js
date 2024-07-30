chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg === 'page-click') {
    const data = await chrome.storage.local.get({ counter: 0 });
    let counter = data['counter'];
    counter++;
    chrome.storage.local.set({ counter });
    await chrome.action.setBadgeText({ text: counter.toString() });
  }
});
