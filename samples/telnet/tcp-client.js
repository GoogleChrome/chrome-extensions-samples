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
   * Creates an instance of the client
   *
   * @param {String} host The remote host to connect to
   * @param {Number} port The port to connect to at the remote host
   */
  function TcpClient(host, port) {
    this.host = host;
    this.port = port;
    this._onReceive = this._onReceive.bind(this);
    this._onReceiveError = this._onReceiveError.bind(this);

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
   *
   * @see http://developer.chrome.com/apps/sockets_tcp.html#method-create
   * @param {Function} callback The function to call on connection
   */
  TcpClient.prototype.connect = function(callback) {
    // Register connect callback.
    this.callbacks.connect = callback;

    chrome.sockets.tcp.create({}, this._onCreate.bind(this));
  };

  /**
   * Sends a message down the wire to the remote side
   *
   * @see http://developer.chrome.com/apps/sockets_tcp.html#method-send
   * @param {String} msg The message to send
   * @param {Function} callback The function to call when the message has sent
   */
  TcpClient.prototype.sendMessage = function(msg, callback) {
    // Register sent callback.
    this.callbacks.sent = callback;

    this._stringToArrayBuffer(msg + '\n', function(arrayBuffer) {
      chrome.sockets.tcp.send(this.socketId, arrayBuffer, this._onSendComplete.bind(this));
    }.bind(this));
  };

  /**
   * Sets the callback for when a message is received
   *
   * @param {Function} callback The function to call when a message has arrived
   */
  TcpClient.prototype.addResponseListener = function(callback) {
    // Register received callback.
    this.callbacks.recv = callback;
  };

  /**
   * Disconnects from the remote side
   *
   * @see http://developer.chrome.com/apps/sockets_tcp.html#method-disconnect
   */
  TcpClient.prototype.disconnect = function() {
    chrome.sockets.tcp.onReceive.removeListener(this._onReceive);
    chrome.sockets.tcp.onReceiveError.removeListener(this._onReceiveError);
    chrome.sockets.tcp.disconnect(this.socketId);
    chrome.sockets.tcp.close(this.socketId);
    this.socketId = null;
    this.isConnected = false;
  };

  /**
   * The callback function used for when we attempt to have Chrome
   * create a socket. If the socket is successfully created
   * we go ahead and connect to the remote side.
   *
   * @private
   * @see http://developer.chrome.com/apps/sockets_tcp.html#method-connect
   * @param {Object} createInfo The socket details
   */
  TcpClient.prototype._onCreate = function(createInfo) {
    if (chrome.runtime.lastError) {
      error('Unable to create socket: ' + chrome.runtime.lastError.message);
    }

    this.socketId = createInfo.socketId;
    this.isConnected = true;
    chrome.sockets.tcp.connect(this.socketId, this.host, this.port, this._onConnectComplete.bind(this));
  };

  /**
   * The callback function used for when we attempt to have Chrome
   * connect to the remote side. If a successful connection is
   * made then polling starts to check for data to read
   *
   * @private
   * @param {Number} resultCode Indicates whether the connection was successful
   */
  TcpClient.prototype._onConnectComplete = function(resultCode) {
    if (resultCode < 0) {
      error('Unable to connect to server');
      return;
    }

    // Start listening to message events.
    chrome.sockets.tcp.onReceive.addListener(this._onReceive);
    chrome.sockets.tcp.onReceiveError.addListener(this._onReceiveError);

    if (this.callbacks.connect) {
      console.log('connect complete');
      this.callbacks.connect();
    }
    log('onConnectComplete');
  };

  /**
   * Callback function for when data has been read from the socket.
   * Converts the array buffer that is read in to a string
   * and sends it on for further processing by passing it to
   * the previously assigned callback function.
   *
   * @see http://developer.chrome.com/apps/sockets_tcp.html#event-onReceive
   *
   * @private
   * @see TcpClient.prototype.addResponseListener
   * @param {Object} receiveInfo The incoming message
   */
  TcpClient.prototype._onReceive = function(receiveInfo) {
    if (receiveInfo.socketId != this.socketId)
      return;

    if (this.callbacks.recv) {
      log('onDataRead');
      // Convert ArrayBuffer to string.
      this._arrayBufferToString(receiveInfo.data, function(str) {
        this.callbacks.recv(str);
      }.bind(this));
    }
  };

  /**
   * Callback function for an error occurs on the socket.
   *
   * @see http://developer.chrome.com/apps/sockets_tcp.html#event-onReceiveError
   *
   * @private
   * @param {Object} info The incoming message
   */
  TcpClient.prototype._onReceiveError = function(info) {
    if (info.socketId != this.socketId)
      return;

    error('Unable to receive data from socket: ' + info.resultCode);
  };

  /**
   * Callback for when data has been successfully
   * sent to the socket.
   *
   * @private
   * @param {Object} sendInfo The outgoing message
   */
  TcpClient.prototype._onSendComplete = function(sendInfo) {
    log('onSendComplete');
    // Call sent callback.
    if (this.callbacks.sent) {
      this.callbacks.sent(sendInfo);
    }
  };

  /**
   * Converts an array buffer to a string
   *
   * @private
   * @param {ArrayBuffer} buf The buffer to convert
   * @param {Function} callback The function to call when conversion is complete
   */
  TcpClient.prototype._arrayBufferToString = function(buf, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      callback(e.target.result);
    };
    var blob=new Blob([ buf ], { type: 'application/octet-stream' });
    reader.readAsText(blob);
  };

  /**
   * Converts a string to an array buffer
   *
   * @private
   * @param {String} str The string to convert
   * @param {Function} callback The function to call when conversion is complete
   */
  TcpClient.prototype._stringToArrayBuffer = function(str, callback) {
    var bb = new Blob([str]);
    var f = new FileReader();
    f.onload = function(e) {
       callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
  };


  /**
   * Wrapper function for logging
   */
  function log(msg) {
    console.log(msg);
  }

  /**
   * Wrapper function for error logging
   */
  function error(msg) {
    console.error(msg);
  }

  exports.TcpClient = TcpClient;

})(window);
