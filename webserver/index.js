onload = function() {
  var start = document.getElementById("start");
  var stop = document.getElementById("stop");
  var directory = document.getElementById("directory");

  var socket = chrome.experimental.socket || chrome.socket;
  var socketInfo;
  var filesMap = {};

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

  var writeErrorResponse = function(socketId, errorCode) {
    var file = { size: 0 };
    console.info("writeErrorResponse:: begin... ");
    console.info("writeErrorResponse:: file = " + file);
    var contentType = "text/plain";  //(file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 " +errorCode+ " Not Found\nContent-length: " + file.size + "\nContent-type:" + contentType + "\n\n");
    console.info("writeErrorResponse:: Done setting header...");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);
    console.info("writeErrorResponse:: Done setting view...");
    socket.write(socketId, outputBuffer, function(writeInfo) {
      console.log("WRITE", writeInfo);
      socket.destroy(socketId);
      socket.accept(socketInfo.socketId, onAccept);
    });
    console.info("writeErrorResponse::filereader:: end onload...");

    console.info("writeErrorResponse:: end...");
  };


  var write200Response = function(socketId, file) {
    var contentType = (file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + file.size + "\nContent-type:" + contentType + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);

    var fileReader = new FileReader();
    fileReader.onload = function(e) {
       view.set(new Uint8Array(e.target.result), header.byteLength); 
       socket.write(socketId, outputBuffer, function(writeInfo) {
         console.log("WRITE", writeInfo);
         socket.destroy(socketId); 
         socket.accept(socketInfo.socketId, onAccept);
      });
    };

    fileReader.readAsArrayBuffer(file);
  };

  var onAccept = function(acceptInfo) {
    console.log("ACCEPT", acceptInfo)
    //  Read in the data
    socket.read(acceptInfo.socketId, function(readInfo) {
      console.log("READ", readInfo);
      // Parse the request.
      var data = arrayBufferToString(readInfo.data);
      if(data.indexOf("GET ") == 0) {
        // we can only deal with GET requests
        var uriEnd =  data.indexOf(" ", 4);
        if(uriEnd < 0) { /* throw a wobbler */ return; }
        var uri = data.substring(4, uriEnd);
        var file = filesMap[uri];
        if(!!file == false) { 
          console.warn("File does not exist..."); 
          writeErrorResponse(acceptInfo.socketId, 404); /* File does not exist */ 
          return; 
        }
        logToScreen("GET 200 " + uri);
        write200Response(acceptInfo.socketId, file);
      }
      else {
        // Throw an error
        socket.destroy(acceptInfo.socketId); 
      }
    }); 
  };

  directory.onchange = function(e) {
    if(socketInfo) socket.destroy(socketInfo.socketId);

    var files = e.target.files;

    for(var i = 0; i < files.length; i++) {
      //remove the first first directory
      var path = files[i].webkitRelativePath;
      filesMap[path.substr(path.indexOf("/"))] = files[i];
    }

    start.disabled = false;
    stop.disabled = true;
    directory.disabled = true;
  };

  start.onclick = function() {
    socket.create("tcp", {}, function(_socketInfo) {
      socketInfo = _socketInfo;
      socket.listen(socketInfo.socketId, "127.0.0.1", 8080, 20, function(result) {
        console.log("LISTENING:", result);
        socket.accept(socketInfo.socketId, onAccept);
      });
    });

    directory.disabled = true;
    stop.disabled = false;
    start.disabled = true;
  };

  stop.onclick = function() {
    directory.disabled = false;
    stop.disabled = true;

    socket.destroy(socketInfo.socketId);
  };
};
