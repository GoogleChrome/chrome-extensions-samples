// top level await is available in ES modules loaded from script tags
const [tab] = await chrome.tabs.query({
  active: true,
  lastFocusedWindow: true
});

// tab is undefined if no tabs match
if (tab === undefined) {
  throw new Error('No active tab returned from query.');
}

const tabId = tab.id;
const button = document.getElementById('openSidePanel');
button?.addEventListener('click', async () => {
  await chrome.sidePanel.open({ tabId });
  await chrome.sidePanel.setOptions({
    tabId,
    path: 'sidepanel-tab.html',
    enabled: true
  });
});
