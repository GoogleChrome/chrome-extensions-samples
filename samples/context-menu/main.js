// Holds the data structure for all the context menus used in the app
var CONTEXT_MENU_CONTENTS = {
  forWindows : [
    'foo',
    'bar',
    'baz'
  ],
  forSelection: [
    'Selection context menu'
  ],
  forLauncher : [
    'Launch Window "A"',
    'Launch Window "B"'
  ]
}

function setUpContextMenus() {
  CONTEXT_MENU_CONTENTS.forWindows.forEach(function(commandId) {
    chrome.contextMenus.create({
      title: 'A: ' + commandId,
      type: 'radio',
      id: 'A' + commandId,
      documentUrlPatterns: [ "chrome-extension://*/a.html"],
      contexts: ['all']
    });
  });

  CONTEXT_MENU_CONTENTS.forWindows.forEach(function(commandId) {
    chrome.contextMenus.create({
      title: 'B: ' + commandId,
      type: 'checkbox',
      id: 'B' + commandId,
      documentUrlPatterns: [ "chrome-extension://*/b.html"],
      contexts: ['all']
    });
  });

  CONTEXT_MENU_CONTENTS.forSelection.forEach(function(commandId) {
    chrome.contextMenus.create({
      type: "separator",
      id: 'sep1',
      contexts: ['selection']
    });
    chrome.contextMenus.create( {
      title: commandId + ' "%s"',
      id: commandId,
      contexts: ['selection']
    });
  });

  CONTEXT_MENU_CONTENTS.forLauncher.forEach(function(commandId, index) {
    chrome.contextMenus.create({
      title: commandId,
      id: 'launcher' + index,
      contexts: ['launcher']
    });
  });
}

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('a.html', {id: 'a', outerBounds:{top: 0, left: 0, width: 300, height: 300}});
  chrome.app.window.create('b.html', {id: 'b', outerBounds:{top: 0, left: 310, width: 300, height: 300}});
});

chrome.runtime.onInstalled.addListener(function() {
  // When the app gets installed, set up the context menus
  setUpContextMenus();
});

chrome.contextMenus.onClicked.addListener(function(itemData) {
  if (itemData.menuItemId == "launcher0")
    chrome.app.window.create('a.html', {id: 'a', outerBounds:{top: 0, left: 0, width: 300, height: 300}});
  if (itemData.menuItemId == "launcher1")
    chrome.app.window.create('b.html', {id: 'b', outerBounds:{top: 0, left: 310, width: 300, height: 300}});
});
