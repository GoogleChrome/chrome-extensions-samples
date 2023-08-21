// Store CSS data in the "local" storage area.
const storage = chrome.storage.local;

const message = document.querySelector('#message');

// Check if there is CSS specified.
async function run() {
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
      message.innerText = 'Injected style!';
    } catch (e) {
      console.error(e);
      message.innerText = 'Injection failed. Are you on a special page?';
    }
  } else {
    const optionsUrl = chrome.runtime.getURL('options.html');
    const optionsPageLink = document.createElement('a');
    optionsPageLink.target = '_blank';
    optionsPageLink.href = optionsUrl;
    optionsPageLink.textContent = 'options page';
    message.innerText = '';
    message.appendChild(document.createTextNode('Set a style in the '));
    message.appendChild(optionsPageLink);
    message.appendChild(document.createTextNode(' first.'));
  }
}

run();
