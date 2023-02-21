chrome.runtime.onInstalled.addListener(({ reason, version }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    showReadme();
  }
});

chrome.action.onClicked.addListener((tab) => {
  showReadme();
});

function showReadme(info, tab) {
  const url = chrome.runtime.getURL("readme.html");
  chrome.tabs.create({ url });
}
