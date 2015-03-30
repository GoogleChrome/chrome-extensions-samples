function log(message) {
  document.getElementById('log').textContent += message + '\n';
}

chrome.contextMenus.onClicked.addListener(function(info) {
  if (!document.hasFocus()) {
    log('Ignoring context menu click that happened in another window');
    return;
  }

  log('Item selected in A: ' + info.menuItemId);
});

window.addEventListener("load", function(e){
  log('Window A is loaded');
});

