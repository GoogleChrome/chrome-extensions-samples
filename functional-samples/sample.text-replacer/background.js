chrome.commands.onCommand.addListener((command, tab) => {
  if (command == 'replace-text') {
    replaceText(tab.id);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  // Remove any previously registered context menus to avoid conflicts
  await chrome.contextMenus.removeAll();

  // Register the new set of context menus
  await chrome.contextMenus.create({
    id: 'replace-text-menuitem',
    title: 'Replace text',
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId == 'replace-text-menuitem') {
    replaceText(tab.id);
  }
});

function replaceText(tabId) {
  chrome.scripting.executeScript({
    target: {tabId},
    files: ['content.js'],
  });
}
