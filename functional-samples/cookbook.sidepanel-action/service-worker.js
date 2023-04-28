// Enabled on google.com - disabled on all other sites
const googleURL = 'https://www.google.com';
// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (url.origin === googleURL) {
    chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel.html',
      enabled: true
    });
  } else {
    chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});
