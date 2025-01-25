import xhrShim from './third_party/xhr-shim/xhr-shim.js';
import fetchTitle from './third_party/fetchTitle.js';

globalThis.XMLHttpRequest = xhrShim;

chrome.action.onClicked.addListener(({ windowId, url }) => {
  chrome.sidePanel.open({ windowId });

  fetchTitle(url, (err, title) => {
    chrome.sidePanel.setOptions({
      enabled: true,
      path: `./sidePanel/index.html?title=${title}`
    });
  });
});
