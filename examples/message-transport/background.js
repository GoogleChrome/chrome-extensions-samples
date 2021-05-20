// https://developer.chrome.com/docs/extensions/reference/runtime/#property-id 
var myExstensionId = chrome.runtime.id;
console.log("My Exstension Id is", myExstensionId);


chrome.runtime.onMessage.addListener(
	/* https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
	 * Notice: 'message.recipient' is self-defined
	 */
	function(message, sender, sendResponse) {
		if (sender.id === myExstensionId && message.recipient === 'background') {
			console.log(message)
			resp = {
				data: "message back from background\n" + new Date(),
			}
			if (sender.tab) {
				resp.yourTabId = sender.tab.id;
			}
			sendResponse(resp);
		}
	}
);


function SendMessageToPopup(msg) {
	/* https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
	 * You can call this function with console at DevTools of Service Worker.
	 * Make sure you have opened the popup page of this exstension before call this function
	 */
	chrome.runtime.sendMessage({
		data: msg,
		recipient: "popup",
	}, function(resp) {
		console.log(resp)
	});
}


async function SendMessageToCustom(msg) {
	/* https://developer.chrome.com/docs/extensions/reference/tabs/#method-query
	 * https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage
	 * Make sure you have opened the custom page
	 */
	let customTabs = await chrome.tabs.query({
		url: chrome.runtime.getURL("custom.html")
	});
	if (customTabs.length == 0) {
		console.log("Make sure you have opened the custom page");
		return
	}
	let targetTab = customTabs[0];
	chrome.tabs.sendMessage(
		targetTab.id, {
			recipient: "custom",
			data: msg
		}, {},
		function(resp) {
			console.log(resp);
		}
	);
}


function SendMessageToContent(tabId, msg) {
	/* https://developer.chrome.com/docs/extensions/reference/tabs/#method-get;
	 * https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage
	 * Make sure your content script has loaded in the target tab page
	 */
	chrome.tabs.get(tabId).then(function(tab) {
		chrome.tabs.sendMessage(
			tabId, {
				recipient: "content",
				data: msg
			}, {},
			function(resp) {
				console.log(resp)
			}
		);
	});
}
