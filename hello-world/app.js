function send_udp() {
  chrome.experimental.socket.create('udp', {}, function(socketInfo) {
    var socketId = socketInfo.socketId;
    chrome.experimental.socket.connect(socketId, '127.0.0.1', 1337, function(result) {
      chrome.experimental.socket.write(socketId, "Hello, world!\n", function(sendInfo) {
        console.log("wrote " + sendInfo.bytesWritten);
      });
    });
  });
}
