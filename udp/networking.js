(function(root) {
  // Set-up the NameSpace
  root.chromeNetworking = new (function() {
    var NoAddressException = "No Address";
    var NotConnectedException = "Not Connected";

    var socket = chrome.sockets.udp;

    var baseClient = function() {
      var address;
      var port;
      var socketInfo;
      var connected = false;
      var callbacks = [];
      var self = this;

      this.connect = function(inAddress, inPort, callback, responseHandler) {
        if(!!inAddress == false) throw NoAddressException;

        address = inAddress;
        port = inPort || this.defaultPort;
        console.debug('creating socket', address, port);
        socket.create({}, function(_socketInfo) {
          socketInfo = _socketInfo;
          socket.bind(socketInfo.socketId, "0.0.0.0", 0, function(bindResult) {
            console.debug('bindResult', bindResult);
            connected = (bindResult == 0);
            socket.ondata = function(result) {
              if (callbacks.length > 0) {
                callbacks.shift()(result);           
              }
            };
            socket.onReceive.addListener(this._onReceive);
            callback(connected);
          });
        });
      };

      this._onReceive = function(info) {
        if (info.socketId != socketInfo.socketId)
          return;
        socket.ondata(info);
      }.bind(this);

      this.send = function(data, callback) {
        callback = callback || function() {};
        if(!!address == false) throw NoAddressException; 
        if(connected == false) throw NotConnectedException; 
        socket.send(socketInfo.socketId, data, address, port, function (sendResult) {
          callback(sendResult);
        });
      };

      this.receive = function(callback) {
        if(!!address == false) throw NoAddressException; 
        if(connected == false) throw NotConnectedException;
        callbacks.push(callback);
      };

      this.disconnect = function() {
        if(!!address == false) throw NoAddressException; 
        if(connected == false) throw NotConnectedException; 
        socket.onReceive.removeListener(this._onReceive);
        socket.close(socketInfo.socketId);
        socketInfo = null;
        connected = false;
      };
    };

    var _EchoClient = function(defaultPort) {
      return function() {
        var client = new baseClient();
        this.defaultPort = defaultPort;

        this.connect = client.connect;
        this.disconnect = client.disconnect;

        this.callbacks = {};
        this.echo = function(data, callback) {
          if (!this.callbacks[data]) {
            this.callbacks[data] = [];
          }
          this.callbacks[data].push(callback);
          var self = this;
          client.send(new Uint32Array([data]).buffer, function(sendResult) {
            console.debug('send', sendResult);
            client.receive(function(receiveResult) {
              var u32 = new Uint32Array(receiveResult.data);
              var m = u32[0];
              var cbs = self.callbacks[m];
              if (cbs) {
                cb = cbs.shift();
                if (cb) {
                  cb(receiveResult);
                }
              }
            });
          });
        };
      };
    };

    return {
      // Clients
      clients: {
        udp: {
          echoClient: _EchoClient(7)
        }
      },
      // Exceptions
      exceptions: {
        NoAddressException: NoAddressException,
        NotConnectedException: NotConnectedException
      }
    };
  })(); 
})(this);

