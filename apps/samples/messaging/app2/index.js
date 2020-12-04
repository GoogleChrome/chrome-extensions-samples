(function(context){

  document.getElementById("appid").value=chrome.runtime.id;  
  var logField = document.getElementById("log");
  var sendText=document.getElementById("sendText");
  var sendText=document.getElementById("sendText");
  var sendId=document.getElementById("sendId");
  var send=document.getElementById("send");

  send.addEventListener('click', function() {
    appendLog("sending to "+sendId.value);
    chrome.runtime.sendMessage(
      sendId.value, 
      {myCustomMessage: sendText.value}, 
      function(response) { 
        appendLog("response: "+JSON.stringify(response));
      })
  });


  blocklistedIds = ["none"];

  chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (sender.id in blocklistedIds) {
        sendResponse({"result":"sorry, could not process your message"});
        return;  // don't allow this extension access
      } else if (request.myCustomMessage) {
        appendLog("from "+sender.id+": "+request.myCustomMessage);
        sendResponse({"result":"Ok, got your message"});
      } else {
        sendResponse({"result":"Ops, I don't understand this message"});
      }
    });



  var appendLog = function(message) {
    logField.innerText+="\n"+message;
  }

  context.appendLog = appendLog;

})(window)
