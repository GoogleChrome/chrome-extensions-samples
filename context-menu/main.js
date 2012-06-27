// The click hander will get called when a context menu item is clicked
function click_handler(info, tab) {
	console.log("You clicked the '" + info.menuItemId + "' menu item");
}
// Populate some entries in the context menu
function populate_context_menu() {
	// Create one test item for each context type.
	var contexts = ["cut","snarf","paste","send","pipe","defer"];
	for (var i = 0; i < contexts.length; i++) {
	  var context = contexts[i];
	  var title = "The '" + context + "' menu item";
	  var id = chrome.contextMenus.create({"title": title, "id": context/* , "onclick": function (){} */ } );
	  console.log("'" + context + "' item:" + id);
	}
	// Attach a listener for clicks on the menu
	chrome.contextMenus.onClicked.addListener(click_handler);
}
// Add a listener that sets up the applicaation ofter launch
chrome.experimental.app.onLaunched.addListener(function() {
  chrome.appWindow.create('index.html');
  populate_context_menu();
});
