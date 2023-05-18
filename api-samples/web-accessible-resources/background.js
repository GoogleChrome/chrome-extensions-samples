chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    showReadme();
  }
});

chrome.action.onClicked.addListener(() => {
  showReadme();
});

function showReadme() {
  const url = chrome.runtime.getURL('readme.html');
  chrome.tabs.create({ url });
}
