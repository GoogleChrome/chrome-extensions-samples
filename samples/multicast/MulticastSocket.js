/**
 *
 * @param {Object} config
 * @param {String} config.address
 * @param {Number} config.port
 * @constructor
 */
function MulticastSocket(config) {
  this.config = config;
}

MulticastSocket.prototype.onError = function (message) {};
MulticastSocket.prototype.onConnected = function () {};
MulticastSocket.prototype.onDiagram = function (arrayBuffer, remote_address, remote_port) {};
MulticastSocket.prototype.onDisconnected = function () {};

MulticastSocket.prototype.connect = function (callback) {
  var me = this;
  chrome.sockets.udp.create({bufferSize: 1024 * 1024}, function (createInfo) {
    var socketId = createInfo.socketId;
    var ttl = 12;
    chrome.sockets.udp.setMulticastTimeToLive(socketId, ttl, function (result) {
      if (result != 0) {
        me.handleError("Set TTL Error: ", "Unknown error");
      }
      chrome.sockets.udp.bind(socketId, "0.0.0.0", me.config.port, function (result) {
        if (result != 0) {
          chrome.sockets.udp.close(socketId, function () {
            me.handleError("Error on bind(): ", result);
          });
        } else {
          chrome.sockets.udp.joinGroup(socketId, me.config.address, function (result) {
            if (result != 0) {
              chrome.sockets.udp.close(socketId, function () {
                me.handleError("Error on joinGroup(): ", result);
              });
            } else {
              me.socketId = socketId;
              chrome.sockets.udp.onReceive.addListener(me.onReceive.bind(me));
              chrome.sockets.udp.onReceiveError.addListener(me.onReceiveError.bind(me));
              me.onConnected();
              if (callback) {
                callback.call(me);
              }
            }
          });
        }
      });
    });
  });
};

MulticastSocket.prototype.disconnect = function (callback) {
  var me = this;
  chrome.sockets.udp.onReceive.removeListener(me.onReceive.bind(me));
  chrome.sockets.udp.onReceiveError.removeListener(me.onReceiveError.bind(me));
  chrome.sockets.udp.close(me.socketId, function () {
    me.socketId = undefined;
    me.onDisconnected();
    if (callback) {
      callback.call(me);
    }
  });
};

MulticastSocket.prototype.handleError = function (additionalMessage, alternativeMessage) {
  var err = chrome.runtime.lastError;
  err = err && err.message || alternativeMessage;
  this.onError(additionalMessage + err);
};

MulticastSocket.prototype.onReceive = function (info) {
  this.onDiagram(info.data, info.remoteAddress, info.remotePort);
};

MulticastSocket.prototype.onReceiveError = function (socketId, resultCode) {
  this.handleError("", resultCode);
  this.disconnect();
};

MulticastSocket.prototype.arrayBufferToString = function (arrayBuffer) {
  // UTF-16LE
  return String.fromCharCode.apply(String, new Uint16Array(arrayBuffer));
};

MulticastSocket.prototype.stringToArrayBuffer = function (string) {
  // UTF-16LE
  var buf = new ArrayBuffer(string.length * 2);
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = string.length; i < strLen; i++) {
    bufView[i] = string.charCodeAt(i);
  }
  return buf;
};

MulticastSocket.prototype.sendDiagram = function (message, callback, errCallback) {
  if (typeof message === 'string') {
    message = this.stringToArrayBuffer(message);
  }
  if (!message || message.byteLength == 0 || !this.socketId) {
    if (callback) {
      callback.call(this);
    }
    return;
  }
  var me = this;
  chrome.sockets.udp.send(me.socketId, message, me.config.address, me.config.port,
      function (sendInfo) {
    if (sendInfo.resultCode >= 0 && sendInfo.bytesSent >= 0) {
      if (callback) {
        callback.call(me);
      }
    } else {
      if (errCallback) {
        errCallback();
      } else {
        me.handleError("");
        if (result.bytesSent == -15) {
          me.disconnect();
        }
      }
    }
  });
};
