// https://developer.chrome.com/docs/extensions/reference/runtime/#property-id 
var myExstensionId = chrome.runtime.id;


var btn1Ele = document.getElementById('btn1');
btn1Ele.onclick = function() {
	// https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
	chrome.runtime.sendMessage(myExstensionId, {
		data: "message send by popup",
		recipient: "background",
	}, function(resp) {
		alert(resp.data)
	})
}


chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse) {
		/* https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
		 * Notice: 'message.recipient' is self-defined
		 */
		if (sender.id === myExstensionId && message.recipient === 'popup') {
			alert(JSON.stringify(message))
			sendResponse({
				data: "message back from popup\n" + new Date()
			})
		}
	}
);


/* https://developer.chrome.com/docs/extensions/reference/tabs/#method-create
 * Open a new tab with our custom page in the exstension
 */
var btn2Ele = document.getElementById('btn2');
btn2Ele.onclick = async function() {
	// https://developer.chrome.com/docs/extensions/reference/runtime/#method-getURL
	let url = chrome.runtime.getURL("custom.html")
	chrome.tabs.create({
		url
	});
}
