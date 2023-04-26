async function setPanel() {
  await chrome.sidePanel.setOptions({ path: 'sidepanel.html', enabled: true });
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

async function clearPanel() {
  await chrome.sidePanel.setOptions({ enabled: false });
}
// Enabled on google.com - disabled on all other sites
const googleURL = 'https://www.google.com/';

chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let activeTab = tabs[0];
    console.log(activeTab.url);
    if (activeTab.url === googleURL) {
      setPanel();
    } else {
      clearPanel();
    }
  });
});
