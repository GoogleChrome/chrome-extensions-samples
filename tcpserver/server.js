
// quick terminal->textarea simulation
var log = (function(){
  var area=document.querySelector("#serverlog");
  var output=function(str) {
    if (str.length>0 && str.charAt(str.length-1)!='\n') {
      str+='\n'
    }
    area.innerText=str+area.innerText;
    if (console) console.log(str);
  };
  return {output: output};
})();


chrome.runtime.getBackgroundPage(function(bgPage) {

 bgPage.log.addListener(function(str) {
    log.output(str);
  });

 bgPage.TcpServer.getNetworkAddresses(function(list) {
    var addr=document.querySelector("#addresses");
    for (var i=0; i<list.length; i++) {
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(list[i].address)) {
        var option = document.createElement('option');
        option.text = list[i].name+" ("+list[i].address+")";
        option.value = list[i].address;
        addr.appendChild(option);
      }
    };
  });

  function setConnectedState(addr, port) {
    document.querySelector(".serving-at").innerText=addr+":"+port;
    document.querySelector("#server").className="connected";
  }

  document.getElementById('serverStart').addEventListener('click', function() {
    var addr=document.getElementById("addresses").value;
    var port=parseInt(document.getElementById("serverPort").value);
    setConnectedState(addr, port);
    bgPage.startServer(addr, port);
  });

  document.getElementById('serverStop').addEventListener('click', function() {
    document.querySelector("#server").className="";
    bgPage.stopServer();
  })

  var currentState=bgPage.getServerState();
  if (currentState.isConnected) {
    setConnectedState(currentState.addr, currentState.port);
  }

})
