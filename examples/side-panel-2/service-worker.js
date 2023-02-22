async function setPanel() {
  console.log("setPanel");
  await chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
}

async function clearPanel() {
  console.log("clearPanel");
  await chrome.sidePanel.setOptions({ enabled: false });
}
// Enabled on google.com - disabled on all other sites
const googleURL = "https://www.google.com/";

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    console.log(activeTab.url);
    if (activeTab.url === googleURL) {
    setPanel();
    } else {
    clearPanel()
    }
  });
});


