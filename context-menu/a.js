var CONTEXT_MENU_COMMANDS = ['foo', 'bar', 'baz'];

function log(message) {
  document.getElementById('log').textContent += message + '\n';
}

function setUpContextMenu() {
  chrome.contextMenus.removeAll(function() {
    CONTEXT_MENU_COMMANDS.forEach(function(commandId) {
      chrome.contextMenus.create({
        title: 'A: ' + commandId,
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

  log('Item selected in A: ' + info.menuItemId);
});

onload = function() {
  log('A is loaded');
  setUpContextMenu();
}

onfocus = function() {
  log('A is focused');
  setUpContextMenu();
}
