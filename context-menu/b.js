var CONTEXT_MENU_COMMANDS = ['foo', 'bar', 'baz'];

function log(message) {
  document.getElementById('log').textContent += message + '\n';
}

function setUpContextMenu() {
  chrome.contextMenus.removeAll(function() {
    CONTEXT_MENU_COMMANDS.forEach(function(commandId) {
      chrome.contextMenus.create({
        title: 'B: ' + commandId,
        id: commandId,
        contexts: ['all']
      });
    });
  });
}

chrome.contextMenus.onClicked.addListener(function(info) {
  if (!document.hasFocus()) {
    log('Ignoring context menu click that happened in another window');
    return;
  }

  log('Item selected in B: ' + info.menuItemId);
});

onload = function() {
  log('B is loaded');
  setUpContextMenu();
}

onfocus = function() {
  log('B is focused');
  setUpContextMenu();
}
