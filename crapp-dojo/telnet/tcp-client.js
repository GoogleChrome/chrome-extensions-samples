/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Boris Smus (smus@chromium.org)
*/

(function(exports) {
  /**
   * Define some local variables here.
   */
  var socket = chrome.socket || chrome.experimental.socket;
  var dns = chrome.experimental.dns;

  function TcpClient(host, port) {
    this.host = host;
    this.port = port;

    // Callback functions.
    this.callbacks = {
      connect: null,    // Called when socket is connected.
      disconnect: null, // Called when socket is disconnected.
      recv: null,       // Called when client receives data from server.
      sent: null        // Called when client sends data to server.
    };

    // Socket.
    this.socketId = null;
    this.isConnected = false;

    log('initialized tcp client');
  }

  /**
   * Connects to the TCP socket, and creates an open socket.
   */
  TcpClient.prototype.connect = function(callback) {
    // First resolve the hostname to an IP.
    dns.resolve(this.host, function(result) {
      this.addr = result.address;
      socket.create('tcp', {}, this._onCreate.bind(this));

      // Register connect callback.
      this.callbacks.connect = callback;
    }.bind(this));
  }

  TcpClient.prototype.sendMessage = function(msg, callback) {
    this._stringToArrayBuffer(msg + '\n', function(arrayBuffer) {
      socket.write(this.socketId, arrayBuffer, this._onWriteComplete.bind(this));
    }.bind(this));

    // Register sent callback.
    this.callbacks.sent = callback;
  }

  TcpClient.prototype.addResponseListener = function(callback) {
    // Register received callback.
    this.callbacks.recv = callback;
  }

  TcpClient.prototype.disconnect = function() {
    socket.disconnect(this.socketId);
    this.isConnected = false;
  }

  TcpClient.prototype._onCreate = function(createInfo) {
    this.socketId = createInfo.socketId;
    if (this.socketId > 0) {
      socket.connect(this.socketId, this.addr, this.port, this._onConnectComplete.bind(this));
      this.isConnected = true;
    } else {
      error('Unable to create socket');
    }
  }

  TcpClient.prototype._onConnectComplete = function(resultCode) {
    // Start polling for reads.
    setInterval(this._periodicallyRead.bind(this), 500)

    if (this.callbacks.connect) {
      console.log('connect complete');
      this.callbacks.connect();
    }
    log('onConnectComplete');
  }

  TcpClient.prototype._periodicallyRead = function() {
    socket.read(this.socketId, null, this._onDataRead.bind(this));
  }

  TcpClient.prototype._onDataRead = function(readInfo) {
    // Call received callback if there's data in the response.
    if (readInfo.resultCode > 0 && this.callbacks.recv) {
      log('onDataRead');
      // Convert ArrayBuffer to string.
      this._arrayBufferToString(readInfo.data, function(str) {
        this.callbacks.recv(str);
      }.bind(this));
    }
  }

  TcpClient.prototype._onWriteComplete = function(writeInfo) {
    log('onWriteComplete');
    // Call sent callback.
    if (this.callbacks.sent) {
      this.callbacks.sent(writeInfo);
    }
  }

  TcpClient.prototype._arrayBufferToString = function(buf, callback) {
    var bb = new WebKitBlobBuilder();
    bb.append(buf);
    var f = new FileReader();
    f.onload = function(e) {
      callback(e.target.result)
    }
    f.readAsText(bb.getBlob());
  }

  TcpClient.prototype._stringToArrayBuffer = function(str, callback) {
    var bb = new WebKitBlobBuilder();
    bb.append(str);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result);
    }
    f.readAsArrayBuffer(bb.getBlob());
  }

  function log(msg) {
    //document.getElementById('log').innerHTML += msg + '<br/>';
    console.log(msg);
  }

  function error(msg) {
    //document.getElementById('log').innerHTML += '<strong>Error: </strong>' + msg + '<br/>';
    console.error(msg);
  }

  exports.TcpClient = TcpClient;

})(window);
