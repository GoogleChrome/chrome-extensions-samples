console.log("background");

async function setPanel1() {
  console.log("setPanel");
  await chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
}

async function clearPanel() {
  console.log("clearPanel");
  await chrome.sidePanel.setOptions({ enabled: false });
}

const extensionsURL = "https://developer.chrome.com/docs/extensions/";

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    console.log(activeTab.url);
    getPanel();
    if (activeTab.url === extensionsURL) {
    setPanel1();
    getPanel();
    } else {
      clearPanel()
    }
  });
});


async function getPanel() {
  const result = await chrome.sidePanel.getOptions({});
  console.log("getPanel", result);
  return result
}

getPanel();

