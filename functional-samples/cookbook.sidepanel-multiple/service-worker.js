chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.sidePanel.setOptions({
      path: 'sidepanels/welcome-sp.html'
    });
  }
});

chrome.tabs.onActivated.addListener(async () => {
  const result = await chrome.sidePanel.getOptions({});
  if (result.path === 'sidepanels/welcome-sp.html') {
    await chrome.sidePanel.setOptions({
      path: 'sidepanels/main-sp.html'
    });
  }
});
