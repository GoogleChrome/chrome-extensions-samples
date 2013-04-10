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

  var appendLog = function(message) {
    logField.innerText+="\n"+message;
  }

  context.appendLog = appendLog;

})(window)
