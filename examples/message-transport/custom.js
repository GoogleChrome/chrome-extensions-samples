// https://developer.chrome.com/docs/extensions/reference/runtime/#property-id 
var myExstensionId = chrome.runtime.id;


var btn1Ele = document.getElementById('btn1');
btn1Ele.onclick = function() {
	// https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage
	chrome.runtime.sendMessage(myExstensionId, {
		data: "message send by custom page",
		recipient: "background",
	}, function(resp) {
		alert(resp.data)
	})
}


var msgBoxEle = document.getElementById('msg-box');
chrome.runtime.onMessage.addListener(
	function(message, sender, sendResponse) {
		/* https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
		 * Notice: 'message.recipient' is self-defined
		 */
		if (sender.id === myExstensionId && message.recipient === 'custom') {
			let msgliEle = document.createElement('li');
			msgliEle.innerText = new Date() + " : " + message.data;
			msgBoxEle.appendChild(msgliEle);
			sendResponse({
				data: "message back from custom page\n" + new Date()
			})
		}
	}
);
