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

function setUpContextMenus(sContext) {
	// Because we want windows A and B to have different context menus, we need
	// to pull some sleight-of-hand here and reconstruct the context menu each time
	chrome.contextMenus.removeAll(function() {
		// in this completion callback, reconstruct the menu for the window
		if (sContext == "windowA") {
		    CONTEXT_MENU_CONTENTS.forWindows.forEach(function(commandId) {
		      chrome.contextMenus.create({
		        title: 'A: ' + commandId,
		        type: 'radio',
		        id: commandId,
		        contexts: ['all']
		      });
		    });
		    CONTEXT_MENU_CONTENTS.forSelection.forEach(function(commandId) {
	    		chrome.contextMenus.create({
	    			type: "separator",
	    	        id: 'sep1',
	    	        contexts: ['selection']
	    	    });
				chrome.contextMenus.create({
					title: commandId + ' "%s"',
					id: commandId,
					contexts: ['selection']
				});
		    });
		}
		else if (sContext == "windowB") {
		    CONTEXT_MENU_CONTENTS.forWindows.forEach(function(commandId) {
		      chrome.contextMenus.create({
		        title: 'B: ' + commandId,
		        type: 'checkbox',
		        id: commandId,
		        contexts: ['all']
		      });
		    });
		}

		// put back the menu items for the launcher
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
		chrome.contextMenus.create({
			type: "separator",
	        id: 'launcher3',
	        contexts: ['launcher']
	    });
	});
}
