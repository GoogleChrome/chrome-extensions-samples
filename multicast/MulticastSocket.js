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

function emptyFn() {
}

var mc_proto = MulticastSocket.prototype;
mc_proto.onError = function (message) {
};
mc_proto.onConnected = function () {
};
mc_proto.onDiagram = function (arrayBuffer, remote_address, remote_port) {
};
mc_proto.onDisconnected = function () {
};

mc_proto.connect = function (callback) {
  var me = this;
  chrome.socket.create('udp', function (socket) {
    var socketId = socket.socketId;
    chrome.socket.setMulticastTimeToLive(socketId, 12, function (result) {
      if (result != 0) {
        me.handleError("Set TTL Error: ", "Unkown error");
      }
      chrome.socket.bind(socketId, "0.0.0.0", me.config.port, function (result) {
        if (result != 0) {
          chrome.socket.destroy(socketId);
          me.handleError("Error on bind(): ", result);
        } else {
          chrome.socket.joinGroup(socketId, me.config.address, function (result) {
            if (result != 0) {
              chrome.socket.destroy(socketId);
              me.handleError("Error on joinGroup(): ", result);
            } else {
              me.socketId = socketId;
              me._poll();
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

mc_proto.disconnect = function (callback) {
  var socketId = this.socketId;
  this.socketId = undefined;
  chrome.socket.destroy(socketId);
  this.onDisconnected();
  if (callback) {
    callback.call(this);
  }
};

mc_proto.handleError = function (additionalMessage, alternativeMessage) {
  var err = chrome.runtime.lastError;
  err = err && err.message || alternativeMessage;
  this.onError(additionalMessage + err);
};

mc_proto._poll = function () {
  var me = this;
  if (me.socketId) {
    chrome.socket.recvFrom(me.socketId, 1048576, function (result) {
      if (result.resultCode >= 0) {
        me.onDiagram(result.data, result.address, result.port);
        me._poll();
      } else {
        me.handleError("", result.resultCode);
        me.disconnect();
      }
    });
  }
};

mc_proto.arrayBufferToString = function (arrayBuffer) {
  // UTF-16LE
  return String.fromCharCode.apply(String, new Uint16Array(arrayBuffer));
};

mc_proto.stringToArrayBuffer = function (string) {
  // UTF-16LE
  var buf = new ArrayBuffer(string.length * 2);
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = string.length; i < strLen; i++) {
    bufView[i] = string.charCodeAt(i);
  }
  return buf;
};

mc_proto.sendDiagram = function (message, callback, errCallback) {
  if (typeof message === 'string') {
    message = this.stringToArrayBuffer(message);
  }
  if (message && message.byteLength >= 0 && this.socketId) {
    var me = this;
    try {
      chrome.socket.sendTo(this.socketId,
        message,
        this.config.address,
        this.config.port,
        function (result) {
          if (result.bytesWritten >= 0) {
            if (callback) {
              callback.call(me);
            }
          } else {
            if (errCallback) {
              errCallback()
            } else {
              me.handleError("");
              if (result.bytesWritten == -15) {
                me.disconnect();
              }
            }
          }
        });
    } catch (e) {
      me.handleError('Exception: ' + e);
      me.disconnect();
    }
  } else if (callback) {
    callback.call(this);
  }
};