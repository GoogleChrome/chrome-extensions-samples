/**
 *
 * @param {Object} config
 * @param {String} config.address
 * @param {Number} config.port
 * @constructor
 */
function MulticastSocket(config) {
  this.config = config;
  this._onReceive = this._onReceive.bind(this);
  this._onReceiveError = this._onReceiveError.bind(this);
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
  chrome.sockets.udp.create(function (socket) {
    var socketId = socket.socketId;
    chrome.sockets.udp.setMulticastTimeToLive(socketId, 12, function (result) {
      if (result != 0) {
        me.handleError("Set TTL Error: ", "Unkown error");
      }
      chrome.sockets.udp.bind(socketId, "0.0.0.0", me.config.port, function (result) {
        if (result != 0) {
          chrome.sockets.udp.close(socketId);
          me.handleError("Error on bind(): ", result);
        } else {
          chrome.sockets.udp.onReceive.addListener(me._onReceive);
          chrome.sockets.udp.onReceiveError.addListener(me._onReceiveError);
          chrome.sockets.udp.joinGroup(socketId, me.config.address, function (result) {
            if (result != 0) {
              chrome.sockets.udp.close(socketId);
              me.handleError("Error on joinGroup(): ", result);
            } else {
              me.socketId = socketId;
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
  chrome.sockets.udp.onReceive.removeListener(me._onReceive);
  chrome.sockets.udp.onReceiveError.removeListener(me._onReceiveError);
  chrome.sockets.udp.close(socketId);
  this.onDisconnected();
  if (callback) {
    callback.call(this);
  }
};

mc_proto._onReceive = function (info) {
  if (info.socketId != this.socketId)
    return;
  this.onDiagram(info.data, info.remoteAddress, info.remotePort);
};

mc_proto._onReceiveError = function (info) {
  if (info.socketId != this.socketId)
    return;
  this.handleError("", info.resultCode);
  this.disconnect();
};

mc_proto.handleError = function (additionalMessage, alternativeMessage) {
  var err = chrome.runtime.lastError;
  err = err && err.message || alternativeMessage;
  this.onError(additionalMessage + err);
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
      chrome.sockets.udp.send(this.socketId,
        message,
        this.config.address,
        this.config.port,
        function (result) {
          if (result.resultCode >= 0) {
            if (callback) {
              callback.call(me);
            }
          } else {
            if (errCallback) {
              errCallback();
            } else {
              me.handleError("");
              if (result.resultCode == -15) {
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