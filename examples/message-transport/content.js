// https://developer.chrome.com/docs/extensions/reference/runtime/#property-id 
var myExstensionId = chrome.runtime.id;


// https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
chrome.runtime.sendMessage(myExstensionId, {
	recipient: "background"
}, function(resp) {
	console.log(resp)
})


/* https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
 * Notice: 'message.recipient' is self-defined
 */
chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse) {
		if (sender.id === myExstensionId && message.recipient === 'content') {
			alert(JSON.stringify(message))
			sendResponse({
				data: "message back from content script\n" + new Date()
			})
		}
	}
);
