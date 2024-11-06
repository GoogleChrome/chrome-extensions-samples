import xhrShim from './lib/xhr-shim.js';
import fetchTitle from './lib/fetchTitle.js';

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
