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

Author: Renato Mangini (mangini@chromium.org)
*/

const DEFAULT_MAX_CONNECTIONS=5;

(function(exports) {

  // Define some local variables here.
  var socket = chrome.socket || chrome.experimental.socket;
  var dns = chrome.experimental.dns;

  /**
   * Creates an instance of the client
   *
   * @param {String} host The remote host to connect to
   * @param {Number} port The port to connect to at the remote host
   */
  function TcpServer(addr, port, options) {
    this.addr = addr;
    this.port = port;
    this.maxConnections = typeof(options) != 'undefined'
        && options.maxConnections || DEFAULT_MAX_CONNECTIONS;

    // Callback functions.
    this.callbacks = {
      listen: null,    // Called when socket is connected.
      connect: null,    // Called when socket is connected.
      disconnect: null, // Called when socket is disconnected.
      recv: null,       // Called when client receives data from server.
      sent: null        // Called when client sends data to server.
    };

    // Sockets open
    this.openSockets=[];

    // server socket (one server connection, accepts and opens one socket per client)
    this.serverSocketId = null;

    log('initialized tcp server, not listening yet');
  }


  /**
   * Static method to return available network interfaces.
   *
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-getNetworkList
   *
   * @param {Function} callback The function to call with the available network
   * interfaces. The callback parameter is an array of
   * {name(string), address(string)} objects. Use the address property of the
   * preferred network as the addr parameter on TcpServer contructor.
   */
  TcpServer.getNetworkAddresses=function(callback) {
    socket.getNetworkList(callback);
  }

  TcpServer.prototype.isConnected=function() {
    return this.serverSocketId > 0;
  }

  /**
   * Connects to the TCP socket, and creates an open socket.
   *
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-create
   * @param {Function} callback The function to call on connection
   */
  TcpServer.prototype.listen = function(callback) {
    // Register connect callback.
    this.callbacks.connect = callback;
    socket.create('tcp', {}, this._onCreate.bind(this));
  };


  /**
   * Disconnects from the remote side
   *
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-disconnect
   */
  TcpServer.prototype.disconnect = function() {
    if (this.serverSocketId) socket.disconnect(this.serverSocketId);
    for (var i=0; i<this.openSockets.length; i++) {
      try {
        this.openSockets[i].disconnect();
      } catch (ex) {
        console.log(ex);
      }
    }
    this.openSockets=[];
    this.serverSocketId=0;
  };

  /**
   * The callback function used for when we attempt to have Chrome
   * create a socket. If the socket is successfully created
   * we go ahead and start listening for incoming connections.
   *
   * @private
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-connect
   * @param {Object} createInfo The socket details
   */
  TcpServer.prototype._onCreate = function(createInfo) {
    this.serverSocketId = createInfo.socketId;
    if (this.serverSocketId > 0) {
      socket.listen(this.serverSocketId, this.addr, this.port, null,
        this._onListenComplete.bind(this));
      this.isListening = true;
    } else {
      error('Unable to create socket');
    }
  };

  /**
   * The callback function used for when we attempt to have Chrome
   * connect to the remote side. If a successful connection is
   * made then we accept it by opening it in a new socket (accept method)
   *
   * @private
   */
  TcpServer.prototype._onListenComplete = function(resultCode) {
    if (resultCode===0) {
      socket.accept(this.serverSocketId, this._onAccept.bind(this));
    } else {
      error('Unable to listen to socket. Resultcode='+resultCode);
    }
  }

  TcpServer.prototype._onAccept = function(resultInfo) {
    // continue to accept other connections:
    socket.accept(this.serverSocketId, this._onAccept.bind(this));

    if (resultInfo.resultCode===0) {
      if (this.openSockets.length>=this.maxConnections) {
        this._onNoMoreConnectionsAvailable(resultInfo.socketId);
        return;
      }

      var tcpConnection = new TcpConnection(resultInfo.socketId);
      this.openSockets.push(tcpConnection);

      tcpConnection.requestSocketInfo(this._onSocketInfo.bind(this));
      log('Incoming connection handled.');

    } else {
      error('Unable to accept incoming connection. Error code='+resultInfo.resultCode);
    }

  }

  TcpServer.prototype._onNoMoreConnectionsAvailable = function(socketId) {
    var msg="No more connections available. Try again later\n";
    _stringToArrayBuffer(msg, function(arrayBuffer) {
      socket.write(socketId, arrayBuffer,
        function() {
          socket.disconnect(socketId);
        });
    });
  }

  TcpServer.prototype._onSocketInfo = function(tcpConnection, socketInfo) {
    if (this.callbacks.connect) {
      this.callbacks.connect(tcpConnection, socketInfo);
    }
  }

  /**
   * Holds a connection to a client
   *
   * @param {number} socketId The ID of the server<->client socket
   */
  function TcpConnection(socketId) {
    this.socketId = socketId;
    this.socketInfo = null;

    // Callback functions.
    this.callbacks = {
      disconnect: null, // Called when socket is disconnected.
      recv: null,       // Called when client receives data from server.
      sent: null        // Called when client sends data to server.
    };

    log('Established client connection. Listening...');

    // Start polling for reads.
    this._onDataRead();
  };

  TcpConnection.prototype.setSocketInfo = function(socketInfo) {
    this.socketInfo = socketInfo;
  };

  TcpConnection.prototype.requestSocketInfo = function(callback) {
    socket.getInfo(this.socketId,
      this._onSocketInfo.bind(this, callback));
  };

  /**
   * Sets the callback for when a message is received
   *
   * @param {Function} callback The function to call when a message has arrived
   */
  TcpConnection.prototype.addDataReceivedListener = function(callback) {
    // Register received callback.
    this.callbacks.recv = callback;
  };


  /**
   * Sends a message down the wire to the remote side
   *
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-write
   * @param {String} msg The message to send
   * @param {Function} callback The function to call when the message has sent
   */
  TcpConnection.prototype.sendMessage = function(msg, callback) {
    _stringToArrayBuffer(msg + '\n', function(arrayBuffer) {
      socket.write(this.socketId, arrayBuffer, this._onWriteComplete.bind(this));
    }.bind(this));

    // Register sent callback.
    this.callbacks.sent = callback;
  };


  /**
   * Disconnects from the remote side
   *
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-disconnect
   */
  TcpConnection.prototype.disconnect = function() {
    if (this.socketId) socket.disconnect(this.socketId);
  };


  /**
   * Checks for new data to read from the socket
   *
   * @see http://developer.chrome.com/trunk/apps/socket.html#method-read
   * @private
   */

  /**
   * Callback function for when socket details (socketInfo) is received.
   * Stores the socketInfo for future reference and pass it to the
   * callback sent in its parameter.
   *
   * @private
   */
  TcpConnection.prototype._onSocketInfo = function(callback, socketInfo) {
    if (callback && typeof(callback)!='function') {
      throw "Illegal value for callback: "+callback;
    }
    this.socketInfo = socketInfo;
    callback(this, socketInfo);
  }

  /**
   * Callback function for when data has been read from the socket.
   * Converts the array buffer that is read in to a string
   * and sends it on for further processing by passing it to
   * the previously assigned callback function.
   *
   * @private
   * @see TcpConnection.prototype.addDataReceivedListener
   * @param {Object} readInfo The incoming message
   */
  TcpConnection.prototype._onDataRead = function(readInfo) {
    // Any read error is considered a disconnect from the remote host.
    // Disconnect our socket in that case.
    if (readInfo && readInfo.resultCode < 0) {
      this.disconnect();
      return;
    }

    // Call received callback if there's data in the response.
    if (this.callbacks.recv) {
      log('onDataRead');
      // Convert ArrayBuffer to string.
      _arrayBufferToString(readInfo.data, this.callbacks.recv.bind(this));
    }
    socket.read(this.socketId, null, this._onDataRead.bind(this));
  };


  /**
   * Callback for when data has been successfully
   * written to the socket.
   *
   * @private
   * @param {Object} writeInfo The outgoing message
   */
  TcpConnection.prototype._onWriteComplete = function(writeInfo) {
    log('onWriteComplete');
    // Call sent callback.
    if (this.callbacks.sent) {
      this.callbacks.sent(writeInfo);
    }
  };



  /**
   * Converts an array buffer to a string
   *
   * @private
   * @param {ArrayBuffer} buf The buffer to convert
   * @param {Function} callback The function to call when conversion is complete
   */
  function _arrayBufferToString(buf, callback) {
    var bb = new Blob([new Uint8Array(buf)]);
    var f = new FileReader();
    f.onload = function(e) {
      callback(e.target.result);
    };
    f.readAsText(bb);
  }

  /**
   * Converts a string to an array buffer
   *
   * @private
   * @param {String} str The string to convert
   * @param {Function} callback The function to call when conversion is complete
   */
  function _stringToArrayBuffer(str, callback) {
    var bb = new Blob([str]);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
  }


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

  exports.TcpServer = TcpServer;
  exports.TcpConnection = TcpConnection;

})(window);
