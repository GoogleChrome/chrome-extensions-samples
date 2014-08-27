chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('a.html', {bounds:{top: 0, left: 0, width: 300, height: 300}});
  chrome.app.window.create('b.html', {bounds:{top: 0, left: 310, width: 300, height: 300}});
});

chrome.runtime.onInstalled.addListener(function() {
	// When the app gets installed, set up the context menus
	chrome.contextMenus.create({
        title: CONTEXT_MENU_CONTENTS.forLauncher[0],
        id: 'launcher1',
        contexts: ['launcher']
    });
	chrome.contextMenus.create({
        title: CONTEXT_MENU_CONTENTS.forLauncher[1],
        id: 'launcher2',
        contexts: ['launcher']
    });
});

chrome.contextMenus.onClicked.addListener(function(itemData) {
	if (itemData.menuItemId == "launcher1")
		chrome.app.window.create('a.html', {bounds:{top: 0, left: 0, width: 300, height: 300}});
	if (itemData.menuItemId == "launcher2")
		chrome.app.window.create('b.html', {bounds:{top: 0, left: 310, width: 300, height: 300}});
});
