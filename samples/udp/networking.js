(function(root) {
  // Set-up the NameSpace
  root.chromeNetworking = new (function() {
    var NoAddressException = "No Address";
    var NotConnectedException = "Not Connected";

    var socket = chrome.socket || chrome.experimental.socket;

    var baseClient = function(socketMode) {
      var address;
      var socketInfo;
      var connected = false;
      var callbacks = [];
      var self = this;

      this.connect = function(inAddress, port, callback, responseHandler) {
        if(!!inAddress == false) throw NoAddressException;

        address = inAddress;
        port = port || this.defaultPort;
        console.debug('creating socket', socketMode, address, port);
        socket.create(socketMode, {}, function(_socketInfo) {
          socketInfo = _socketInfo;
          socket.connect(socketInfo.socketId, address, port, function(connectResult) {
            console.debug('connectResult', connectResult);
            connected = (connectResult == 0);
            socket.ondata = function(result) {
              if (callbacks.length > 0) {
                callbacks.shift()(result);           
              }
            };
            self.poll();
            callback(connected);
          });
        });
      };

      this.poll = function() {
        if(!!address == false) throw NoAddressException; 
        if(connected == false) throw NotConnectedException;
        socket.read(socketInfo.socketId, (function(result) {
          if (result.resultCode > 0) {
            socket.ondata(result);
          }
          this.poll();
        }).bind(this));
      };

      this.send = function(data, callback) {
        callback = callback || function() {};
        if(!!address == false) throw NoAddressException; 
        if(connected == false) throw NotConnectedException; 
        socket.write(socketInfo.socketId, data, function(sendResult) {
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
        socket.disconnect(socketInfo.socketId);
        socket.destroy(socketInfo.socketId);
        connected = false;
      };
    };

    var _EchoClient = function(socketMode, defaultPort) {
      return function() {
        var client = new baseClient(socketMode);
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
          echoClient: _EchoClient('udp', 7)
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

