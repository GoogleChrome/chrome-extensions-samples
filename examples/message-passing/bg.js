/*this function get the message from myscript.js*/
chrome.runtime.onMessage.addListener(function(response,sender,sendResponse){
    alert (response);
});