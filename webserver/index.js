onload = function() {
  var start = document.getElementById("start");
  var stop = document.getElementById("stop");
  var hosts = document.getElementById("hosts");
  var port = document.getElementById("port");
  var directory = document.getElementById("directory");

  var socket = chrome.sockets.tcpServer;
  var clientSocket = chrome.sockets.tcp;
  var socketInfo;
  var filesMap = {};
  var clientSocketIds = {};

  var stringToUint8Array = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for(var i = 0; i < string.length; i++) {
      view[i] = string.charCodeAt(i);
    }
    return view;
  };

  var arrayBufferToString = function(buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for(var s = 0; s < uArrayVal.length; s++) {
      str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
  };

  var logToScreen = function(log) {
    logger.textContent += log + "\n";
  }

  var writeErrorResponse = function(socketId, errorCode, keepAlive) {
    var file = { size: 0 };
    console.info("writeErrorResponse:: begin... ");
    console.info("writeErrorResponse:: file = " + file);
    var contentType = "text/plain"; //(file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 " + errorCode + " Not Found\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    console.info("writeErrorResponse:: Done setting header...");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);
    console.info("writeErrorResponse:: Done setting view...");
    clientSocket.send(socketId, outputBuffer, function(writeInfo) {
      console.log("WRITE", writeInfo);
      if (!keepAlive) {
        closeClientSocket(socketId);
      }
    });
    console.info("writeErrorResponse::filereader:: end onload...");

    console.info("writeErrorResponse:: end...");
  };

  var write200Response = function(socketId, file, keepAlive) {
    var contentType = (file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);

    var fileReader = new FileReader();
    fileReader.onload = function(e) {
       view.set(new Uint8Array(e.target.result), header.byteLength);
       clientSocket.send(socketId, outputBuffer, function(writeInfo) {
         console.log("WRITE", writeInfo);
         if (!keepAlive) {
           closeClientSocket(socketId);
         }
      });
    };

    fileReader.readAsArrayBuffer(file);
  };

  var addClientSocket = function(socketId) {
    clientSocketIds[socketId] = socketId;
    clientSocket.setPaused(socketId, false);
  };

  var closeClientSocket = function(socketId) {
    delete clientSocketIds[socketId];
    clientSocket.close(socketId);
  };

  var onAccept = function(acceptInfo) {
    console.log("ACCEPT", acceptInfo);
    addClientSocket(acceptInfo.clientSocketId);
  };

  var onReceive = function(readInfo) {
    if (clientSocketIds[readInfo.socketId] !== readInfo.socketId)
      return;

    var socketId = readInfo.socketId;
    console.log("READ", readInfo);
    // Parse the request.
    var data = arrayBufferToString(readInfo.data);
    if (data.indexOf("GET ") == 0) {
      var keepAlive = false;
      if (data.indexOf("Connection: keep-alive") != -1) {
        keepAlive = true;
      }

      // we can only deal with GET requests
      var uriEnd = data.indexOf(" ", 4);
      if (uriEnd < 0) { /* throw a wobbler */ return; }
      var uri = data.substring(4, uriEnd);
      // strip qyery string
      var q = uri.indexOf("?");
      if (q != -1) {
        uri = uri.substring(0, q);
      }
      var file = filesMap[uri];
      if (!!file == false) {
        console.warn("File does not exist..." + uri);
        writeErrorResponse(socketId, 404, keepAlive);
        return;
      }
      logToScreen("GET 200 " + uri);
      write200Response(socketId, file, keepAlive);
    }
    else {
      // Throw an error
      closeClientSocket(socketId);
    }
  };

  var onReceiveError = function(readInfo) {
    if (clientSocketIds[readInfo.socketId] !== readInfo.socketId)
      return;

    var socketId = readInfo.socketId;
    console.log("READ ERROR", readInfo);
    closeClientSocket(socketId);
  };

  directory.onchange = function(e) {
    if (socketInfo) {
      socket.close(socketInfo.socketId);
      socketInfo = null;
    }

    var files = e.target.files;

    for(var i = 0; i < files.length; i++) {
      //remove the first first directory
      var path = files[i].webkitRelativePath;
      if (path && path.indexOf("/")>=0) {
       filesMap[path.substr(path.indexOf("/"))] = files[i];
      } else {
       filesMap["/"+files[i].fileName] = files[i];
      }
    }

    start.disabled = false;
    stop.disabled = true;
    directory.disabled = true;
  };

  start.onclick = function() {
    socket.create({}, function(_socketInfo) {
      socketInfo = _socketInfo;
      socket.listen(socketInfo.socketId, hosts.value, parseInt(port.value), 50, function(result) {
        console.log("LISTENING:", result);
      });
    });

    directory.disabled = true;
    stop.disabled = false;
    start.disabled = true;
  };

  stop.onclick = function() {
    directory.disabled = false;
    stop.disabled = true;
    start.disabled = false;
    if (socketInfo) {
      socket.close(socketInfo.socketId);
      socketInfo = null;
    }
  };

  chrome.system.network.getNetworkInterfaces(function(interfaces) {
    for(var i in interfaces) {
      var interface = interfaces[i];
      var opt = document.createElement("option");
      opt.value = interface.address;
      opt.innerText = interface.name + " - " + interface.address;
      hosts.appendChild(opt);
    }
  });

  socket.onAccept.addListener(onAccept);
  clientSocket.onReceive.addListener(onReceive);
  clientSocket.onReceiveError.addListener(onReceiveError);
};
