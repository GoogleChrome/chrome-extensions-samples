chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({
    url: chrome.runtime.getURL('window_and_tabs_manager.html')
  });
});
