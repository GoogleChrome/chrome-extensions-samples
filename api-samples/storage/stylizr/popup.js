// Store CSS data in the "local" storage area.
const storage = chrome.storage.local;

const message = document.querySelector('#message');

// Check if there is CSS specified.
(async function () {
  const items = await storage.get('css');
  if (items.css) {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    try {
      await chrome.scripting.insertCSS({
        css: items.css,
        target: {
          tabId: currentTab.id
        }
      });
    } catch (e) {
      if (e) {
        message.innerText = 'Not allowed to inject CSS into special page.';
      } else {
        message.innerText = 'Injected style!';
      }
    }
  } else {
    const optionsUrl = chrome.extension.getURL('options.html');
    message.innerHTML =
      'Set a style in the <a target="_blank" href="' +
      optionsUrl +
      '">options page</a> first.';
  }
})();
