
var tcpClient;
// quick terminal->textarea simulation
var log = (function(){
  var area=document.querySelector("#serverlog");
  var output=function(str) {
    if (str.length>0 && str.charAt(str.length-1)!='\n') {
      str+='\n'
    }
    area.innerText=str+area.innerText;
    console.log(str);
  };
  return {output: output};
})();


document.addEventListener('DOMContentLoaded',  function() {

  TcpServer.getNetworkAddresses(function(list) {
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

  document.getElementById('serverStart').addEventListener('click', function() {
    var addr='127.0.0.1'; //document.getElementById("clientIp").value;
    var port=parseInt(document.getElementById("serverPort").value);
    tcpServer = new TcpServer(addr, port);
    tcpServer.listen(function(tcpConnection, socketInfo) {
      var info="["+socketInfo.peerAddress+":"+socketInfo.peerPort+"] Connection accepted!";
      log.output(info);
      console.log(socketInfo);
      tcpConnection.addDataReceivedListener(function(data) {
        var lines = data.split('\n');
        for (var i=0; i<lines.length; i++) {
          var line=lines[i];
          if (line.length>0) {
            var info="["+socketInfo.peerAddress+":"+socketInfo.peerPort+"] "+line;
            log.output(info);
            var cmd=line.split(' ');
            try {
              tcpConnection.sendMessage(Commands.run(cmd[0], cmd));
            } catch (ex) {
              tcpConnection.sendMessage(ex);
            }
          }
        }
      })
    })
  })
})
