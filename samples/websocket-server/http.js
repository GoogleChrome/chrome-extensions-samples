/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var http = function() {

if (!chrome.sockets || !chrome.sockets.tcpServer)
    return {};

// Wrap chrome.sockets.tcp socketId with a Promise API.
var PSocket = (function() {
  // chrome.sockets.tcp uses a global listener for incoming data so
  // use a map to dispatch to the proper instance.
  var socketMap = {};
  chrome.sockets.tcp.onReceive.addListener(function(info) {
    var pSocket = socketMap[info.socketId];
    if (pSocket) {
      if (pSocket.handlers) {
        // Fulfil the pending read.
        pSocket.handlers.resolve(info.data);
        delete pSocket.handlers;
      }
      else {
        // No pending read so put data on the queue.
        pSocket.readQueue.push(info);
      }
    }
  });

  // Read errors also use a global listener.
  chrome.sockets.tcp.onReceiveError.addListener(function(info) {
    var pSocket = socketMap[info.socketId];
    if (pSocket) {
      if (pSocket.handlers) {
        // Reject the pending read.
        pSocket.handlers.reject(new Error('chrome.sockets.tcp error ' + info.resultCode));
        delete pSocket.handlers;
      }
      else {
        // No pending read so put data on the queue.
        pSocket.readQueue.push(info);
      }
    }
  });

  // PSocket constructor.
  return function(socketId) {
    this.socketId = socketId;
    this.readQueue = [];

    // Register this instance for incoming data processing.
    socketMap[socketId] = this;
    chrome.sockets.tcp.setPaused(socketId, false);
  };
})();

// Returns a Promise<ArrayBuffer> with read data.
PSocket.prototype.read = function() {
  var that = this;
  if (this.readQueue.length) {
    // Return data from the queue.
    var info = this.readQueue.shift();
    if (!info.resultCode)
      return Promise.resolve(info.data);
    else
      return Promise.reject(new Error('chrome.sockets.tcp error ' + info.resultCode));
  }
  else {
    // The queue is empty so install handlers.
    return new Promise(function(resolve, reject) {
      that.handlers = { resolve: resolve, reject: reject };
    });
  }
};

// Returns a Promise<integer> with the number of bytes written.
PSocket.prototype.write = function(data) {
  var that = this;
  return new Promise(function(resolve, reject) {
    chrome.sockets.tcp.send(that.socketId, data, function(info) {
      if (info && info.resultCode >= 0)
        resolve(info.bytesSent);
      else
        reject(new Error('chrome sockets.tcp error ' + (info && info.resultCode)));
    });
  });
};

// Returns a Promise.
PSocket.prototype.close = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    chrome.sockets.tcp.disconnect(that.socketId, function() {
      chrome.sockets.tcp.close(that.socketId, resolve);
    });
  });
};
  
// Http response code strings.
var responseMap = {
  200: 'OK',
  301: 'Moved Permanently',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  500: 'Internal Server Error'};

/**
 * Convert from an ArrayBuffer to a string.
 * @param {ArrayBuffer} buffer The array buffer to convert.
 * @return {string} The textual representation of the array.
 */
var arrayBufferToString = function(buffer) {
  var array = new Uint8Array(buffer);
  var str = '';
  for (var i = 0; i < array.length; ++i) {
    str += String.fromCharCode(array[i]);
  }
  return str;
};

/**
 * Convert from an UTF-8 array to UTF-8 string.
 * @param {array} UTF-8 array
 * @return {string} UTF-8 string
 */
var ary2utf8 = (function() {

  var patterns = [
    {pattern: '0xxxxxxx', bytes: 1},
    {pattern: '110xxxxx', bytes: 2},
    {pattern: '1110xxxx', bytes: 3},
    {pattern: '11110xxx', bytes: 4},
    {pattern: '111110xx', bytes: 5},
    {pattern: '1111110x', bytes: 6}
  ];
  patterns.forEach(function(item) {
    item.header = item.pattern.replace(/[^10]/g, '');
    item.pattern01 = item.pattern.replace(/[^10]/g, '0');
    item.pattern01 = parseInt(item.pattern01, 2);
    item.mask_length = item.header.length;
    item.data_length = 8 - item.header.length;
    var mask = '';
    for (var i = 0, len = item.mask_length; i < len; i++) {
      mask += '1';
    }
    for (var i = 0, len = item.data_length; i < len; i++) {
      mask += '0';
    }
    item.mask = mask;
    item.mask = parseInt(item.mask, 2);
  });

  return function(ary) {
    var codes = [];
    var cur = 0;
    while(cur < ary.length) {
      var first = ary[cur];
      var pattern = null;
      for (var i = 0, len = patterns.length; i < len; i++) {
        if ((first & patterns[i].mask) == patterns[i].pattern01) {
          pattern = patterns[i];
          break;
        }
      }
      if (pattern == null) {
        throw 'utf-8 decode error';
      }
      var rest = ary.slice(cur + 1, cur + pattern.bytes);
      cur += pattern.bytes;
      var code = '';
      code += ('00000000' + (first & (255 ^ pattern.mask)).toString(2)).slice(-pattern.data_length);
      for (var i = 0, len = rest.length; i < len; i++) {
        code += ('00000000' + (rest[i] & parseInt('111111', 2)).toString(2)).slice(-6);
      }
      codes.push(parseInt(code, 2));
    }
    return String.fromCharCode.apply(null, codes);
  };

})();

/**
 * Convert from an UTF-8 string to UTF-8 array.
 * @param {string} UTF-8 string
 * @return {array} UTF-8 array
 */
var utf82ary = (function() {

  var patterns = [
    {pattern: '0xxxxxxx', bytes: 1},
    {pattern: '110xxxxx', bytes: 2},
    {pattern: '1110xxxx', bytes: 3},
    {pattern: '11110xxx', bytes: 4},
    {pattern: '111110xx', bytes: 5},
    {pattern: '1111110x', bytes: 6}
  ];
  patterns.forEach(function(item) {
    item.header = item.pattern.replace(/[^10]/g, '');
    item.mask_length = item.header.length;
    item.data_length = 8 - item.header.length;
    item.max_bit_length = (item.bytes - 1) * 6 + item.data_length;
  });

  var code2utf8array = function(code) {
    var pattern = null;
    var code01 = code.toString(2);
    for (var i = 0, len = patterns.length; i < len; i++) {
      if (code01.length <= patterns[i].max_bit_length) {
        pattern = patterns[i];
        break;
      }
    }
    if (pattern == null) {
      throw 'utf-8 encode error';
    }
    var ary = [];
    for (var i = 0, len = pattern.bytes - 1; i < len; i++) {
      ary.unshift(parseInt('10' + ('000000' + code01.slice(-6)).slice(-6), 2));
      code01 = code01.slice(0, -6);
    }
    ary.unshift(parseInt(pattern.header + ('00000000' + code01).slice(-pattern.data_length), 2));
    return ary;
  };

  return function(str) {
    var codes = [];
    for (var i = 0, len = str.length; i < len; i++) {
      var code = str.charCodeAt(i);
      Array.prototype.push.apply(codes, code2utf8array(code));
    }
    return codes;
  };

})();

/**
 * Convert a string to an ArrayBuffer.
 * @param {string} string The string to convert.
 * @return {ArrayBuffer} An array buffer whose bytes correspond to the string.
 */
var stringToArrayBuffer = function(string) {
  var buffer = new ArrayBuffer(string.length);
  var bufferView = new Uint8Array(buffer);
  for (var i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }
  return buffer;
};

/**
 * An event source can dispatch events. These are dispatched to all of the
 * functions listening for that event type with arguments.
 * @constructor
 */
function EventSource() {
  this.listeners_ = {};
};

EventSource.prototype = {
  /**
   * Add |callback| as a listener for |type| events.
   * @param {string} type The type of the event.
   * @param {function(Object|undefined): boolean} callback The function to call
   *     when this event type is dispatched. Arguments depend on the event
   *     source and type. The function returns whether the event was "handled"
   *     which will prevent delivery to the rest of the listeners.
   */
  addEventListener: function(type, callback) {
    if (!this.listeners_[type])
      this.listeners_[type] = [];
    this.listeners_[type].push(callback);
  },

  /**
   * Remove |callback| as a listener for |type| events.
   * @param {string} type The type of the event.
   * @param {function(Object|undefined): boolean} callback The callback
   *     function to remove from the event listeners for events having type
   *     |type|.
   */
  removeEventListener: function(type, callback) {
    if (!this.listeners_[type])
      return;
    for (var i = this.listeners_[type].length - 1; i >= 0; i--) {
      if (this.listeners_[type][i] == callback) {
        this.listeners_[type].splice(i, 1);
      }
    }
  },

  /**
   * Dispatch an event to all listeners for events of type |type|.
   * @param {type} type The type of the event being dispatched.
   * @param {...Object} var_args The arguments to pass when calling the
   *     callback function.
   * @return {boolean} Returns true if the event was handled.
   */
  dispatchEvent: function(type, var_args) {
    if (!this.listeners_[type])
      return false;
    for (var i = 0; i < this.listeners_[type].length; i++) {
      if (this.listeners_[type][i].apply(
              /* this */ null,
              /* var_args */ Array.prototype.slice.call(arguments, 1))) {
        return true;
      }
    }
  }
};

/**
 * HttpServer provides a lightweight Http web server. Currently it only
 * supports GET requests and upgrading to other protocols (i.e. WebSockets).
 * @constructor
 */
function HttpServer() {
  EventSource.apply(this);
  this.readyState_ = 0;
}

HttpServer.prototype = {
  __proto__: EventSource.prototype,

  /**
   * Listen for connections on |port| using the interface |host|.
   * @param {number} port The port to listen for incoming connections on.
   * @param {string=} opt_host The host interface to listen for connections on.
   *     This will default to 0.0.0.0 if not specified which will listen on
   *     all interfaces.
   */
  listen: function(port, opt_host) {
    var t = this;
    chrome.sockets.tcpServer.create(function(socketInfo) {
      chrome.sockets.tcpServer.onAccept.addListener(function(acceptInfo) {
        if (acceptInfo.socketId === socketInfo.socketId)
          t.readRequestFromSocket_(new PSocket(acceptInfo.clientSocketId));
      });
      
      chrome.sockets.tcpServer.listen(
        socketInfo.socketId,
        opt_host || '0.0.0.0',
        port,
        50,
        function(result) {
          if (!result) {
            t.readyState_ = 1;
          }
          else {
            console.log(
              'listen error ' +
              chrome.runtime.lastError.message +
                ' (normal if another instance is already serving requests)');
          }
        });
    });
  },

  readRequestFromSocket_: function(pSocket) {
    var t = this;
    var requestData = '';
    var endIndex = 0;
    var onDataRead = function(data) {
      requestData += arrayBufferToString(data).replace(/\r\n/g, '\n');
      // Check for end of request.
      endIndex = requestData.indexOf('\n\n', endIndex);
      if (endIndex == -1) {
        endIndex = requestData.length - 1;
        return pSocket.read().then(onDataRead);
      }

      var headers = requestData.substring(0, endIndex).split('\n');
      var headerMap = {};
      // headers[0] should be the Request-Line
      var requestLine = headers[0].split(' ');
      headerMap['method'] = requestLine[0];
      headerMap['url'] = requestLine[1];
      headerMap['Http-Version'] = requestLine[2];
      for (var i = 1; i < headers.length; i++) {
        requestLine = headers[i].split(':', 2);
        if (requestLine.length == 2)
          headerMap[requestLine[0]] = requestLine[1].trim();
      }
      var request = new HttpRequest(headerMap, pSocket);
      t.onRequest_(request);
    };

    pSocket.read().then(onDataRead).catch(function(e) {
      pSocket.close();
    });
  },

  onRequest_: function(request) {
    var type = request.headers['Upgrade'] ? 'upgrade' : 'request';
    var keepAlive = request.headers['Connection'] == 'keep-alive';
    if (!this.dispatchEvent(type, request))
      request.close();
    else if (keepAlive)
      this.readRequestFromSocket_(request.pSocket_);
  },
};

// MIME types for common extensions.
var extensionTypes = {
  'css': 'text/css',
  'html': 'text/html',
  'htm': 'text/html',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'js': 'text/javascript',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'};

/**
 * Constructs an HttpRequest object which tracks all of the request headers and
 * socket for an active Http request.
 * @param {Object} headers The HTTP request headers.
 * @param {Object} pSocket The socket to use for the response.
 * @constructor
 */
function HttpRequest(headers, pSocket) {
  this.version = 'HTTP/1.1';
  this.headers = headers;
  this.responseHeaders_ = {};
  this.headersSent = false;
  this.pSocket_ = pSocket;
  this.writes_ = 0;
  this.bytesRemaining = 0;
  this.finished_ = false;
  this.readyState = 1;
}

HttpRequest.prototype = {
  __proto__: EventSource.prototype,

  /**
   * Closes the Http request.
   */
  close: function() {
    // The socket for keep alive connections will be re-used by the server.
    // Just stop referencing or using the socket in this HttpRequest.
    if (this.headers['Connection'] != 'keep-alive')
      pSocket.close();

    this.pSocket_ = null;
    this.readyState = 3;
  },

  /**
   * Write the provided headers as a response to the request.
   * @param {int} responseCode The HTTP status code to respond with.
   * @param {Object} responseHeaders The response headers describing the
   *     response.
   */
  writeHead: function(responseCode, responseHeaders) {
    var headerString = this.version + ' ' + responseCode + ' ' +
        (responseMap[responseCode] || 'Unknown');
    this.responseHeaders_ = responseHeaders;
    if (this.headers['Connection'] == 'keep-alive')
      responseHeaders['Connection'] = 'keep-alive';
    if (!responseHeaders['Content-Length'] && responseHeaders['Connection'] == 'keep-alive')
      responseHeaders['Transfer-Encoding'] = 'chunked';
    for (var i in responseHeaders) {
      headerString += '\r\n' + i + ': ' + responseHeaders[i];
    }
    headerString += '\r\n\r\n';
    this.write_(stringToArrayBuffer(headerString));
  },

  /**
   * Writes data to the response stream.
   * @param {string|ArrayBuffer} data The data to write to the stream.
   */
  write: function(data) {
    if (this.responseHeaders_['Transfer-Encoding'] == 'chunked') {
      var newline = '\r\n';
      var byteLength = (data instanceof ArrayBuffer) ? data.byteLength : data.length;
      var chunkLength = byteLength.toString(16).toUpperCase() + newline;
      var buffer = new ArrayBuffer(chunkLength.length + byteLength + newline.length);
      var bufferView = new Uint8Array(buffer);
      for (var i = 0; i < chunkLength.length; i++)
        bufferView[i] = chunkLength.charCodeAt(i);
      if (data instanceof ArrayBuffer) {
        bufferView.set(new Uint8Array(data), chunkLength.length);
      } else {
        for (var i = 0; i < data.length; i++)
          bufferView[chunkLength.length + i] = data.charCodeAt(i);
      }
      for (var i = 0; i < newline.length; i++)
        bufferView[chunkLength.length + byteLength + i] = newline.charCodeAt(i);
      data = buffer;
    } else if (!(data instanceof ArrayBuffer)) {
      data = stringToArrayBuffer(data);
    }
    this.write_(data);
  },

  /**
   * Finishes the HTTP response writing |data| before closing.
   * @param {string|ArrayBuffer=} opt_data Optional data to write to the stream
   *     before closing it.
   */
  end: function(opt_data) {
    if (opt_data)
      this.write(opt_data);
    if (this.responseHeaders_['Transfer-Encoding'] == 'chunked')
      this.write('');
    this.finished_ = true;
    this.checkFinished_();
  },

  /**
   * Automatically serve the given |url| request.
   * @param {string} url The URL to fetch the file to be served from. This is
   *     retrieved via an XmlHttpRequest and served as the response to the
   *     request.
   */
  serveUrl: function(url) {
    var t = this;
    var xhr = new XMLHttpRequest();
    xhr.onloadend = function() {
      var type = 'text/plain';
      if (this.getResponseHeader('Content-Type')) {
        type = this.getResponseHeader('Content-Type');
      } else if (url.indexOf('.') != -1) {
        var extension = url.substr(url.indexOf('.') + 1);
        type = extensionTypes[extension] || type;
      }
      console.log('Served ' + url);
      var contentLength = this.getResponseHeader('Content-Length');
      if (xhr.status == 200)
        contentLength = (this.response && this.response.byteLength) || 0;
      t.writeHead(this.status, {
        'Content-Type': type,
        'Content-Length': contentLength});
      t.end(this.response);
    };
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  },

  write_: function(array) {
    var t = this;
    this.bytesRemaining += array.byteLength;
    this.pSocket_.write(array).then(function(bytesWritten) {
      t.bytesRemaining -= bytesWritten;
      t.checkFinished_();
    }).catch(function(e) {
      console.error(e.message);
      return;
    });
  },

  checkFinished_: function() {
    if (!this.finished_ || this.bytesRemaining > 0)
      return;
    this.close();
  }
};

/**
 * Constructs a server which is capable of accepting WebSocket connections.
 * @param {HttpServer} httpServer The Http Server to listen and handle
 *     WebSocket upgrade requests on.
 * @constructor
 */
function WebSocketServer(httpServer) {
  EventSource.apply(this);
  httpServer.addEventListener('upgrade', this.upgradeToWebSocket_.bind(this));
}

WebSocketServer.prototype = {
  __proto__: EventSource.prototype,

  upgradeToWebSocket_: function(request) {
    if (request.headers['Upgrade'] != 'websocket' ||
        !request.headers['Sec-WebSocket-Key']) {
      return false;
    }

    if (this.dispatchEvent('request', new WebSocketRequest(request))) {
      if (request.pSocket_)
        request.reject();
      return true;
    }

    return false;
  }
};

/**
 * Constructs a WebSocket request object from an Http request. This invalidates
 * the Http request's socket and offers accept and reject methods for accepting
 * and rejecting the WebSocket upgrade request.
 * @param {HttpRequest} httpRequest The HTTP request to upgrade.
 */
function WebSocketRequest(httpRequest) {
  // We'll assume control of the socket for this request.
  HttpRequest.apply(this, [httpRequest.headers, httpRequest.pSocket_]);
  httpRequest.pSocket_ = null;
}

WebSocketRequest.prototype = {
  __proto__: HttpRequest.prototype,

  /**
   * Accepts the WebSocket request.
   * @return {WebSocketServerSocket} The websocket for the accepted request.
   */
  accept: function() {
    // Construct WebSocket response key.
    var clientKey = this.headers['Sec-WebSocket-Key'];
    var toArray = function(str) {
      var a = [];
      for (var i = 0; i < str.length; i++) {
        a.push(str.charCodeAt(i));
      }
      return a;
    }
    var toString = function(a) {
      var str = '';
      for (var i = 0; i < a.length; i++) {
        str += String.fromCharCode(a[i]);
      }
      return str;
    }

    // Magic string used for websocket connection key hashing:
    // http://en.wikipedia.org/wiki/WebSocket
    var magicStr = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

    // clientKey is base64 encoded key.
    clientKey += magicStr;
    var sha1 = new Sha1();
    sha1.reset();
    sha1.update(toArray(clientKey));
    var responseKey = btoa(toString(sha1.digest()));
    var responseHeader = {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': responseKey};
    if (this.headers['Sec-WebSocket-Protocol'])
      responseHeader['Sec-WebSocket-Protocol'] = this.headers['Sec-WebSocket-Protocol'];
    this.writeHead(101, responseHeader);
    var socket = new WebSocketServerSocket(this.pSocket_);
    // Detach the socket so that we don't use it anymore.
    this.pSocket_ = 0;
    return socket;
  },

  /**
   * Rejects the WebSocket request, closing the connection.
   */
  reject: function() {
    this.close();
  }
}

/**
 * Constructs a WebSocketServerSocket using the given socketId. This should be
 * a socket which has already been upgraded from an Http request.
 * @param {number} socketId The socket id with an active websocket connection.
 */
function WebSocketServerSocket(pSocket) {
  this.pSocket_ = pSocket;
  this.readyState = 1;
  EventSource.apply(this);
  this.readFromSocket_();
}

WebSocketServerSocket.prototype = {
  __proto__: EventSource.prototype,

  /**
   * Send |data| on the WebSocket.
   * @param {string|Array.<number>|ArrayBuffer} data The data to send over the WebSocket.
   */
  send: function(data) {
    // WebSocket must specify opcode when send frame.
    // The opcode for data frame is 1(text) or 2(binary).
    if (typeof data == 'string' || data instanceof String) {
      this.sendFrame_(1, data);
    } else {
      this.sendFrame_(2, data);
    }
  },

  /**
   * Begin closing the WebSocket. Note that the WebSocket protocol uses a
   * handshake to close the connection, so this call will begin the closing
   * process.
   */
  close: function() {
    if (this.readyState === 1) {
      this.sendFrame_(8);
      this.readyState = 2;
    }
  },

  readFromSocket_: function() {
    var t = this;
    var data = [];
    var message = '';
    var fragmentedOp = 0;
    var fragmentedMessages = [];

    var onDataRead = function(dataBuffer) {
      var a = new Uint8Array(dataBuffer);
      for (var i = 0; i < a.length; i++)
        data.push(a[i]);

      while (data.length) {
        var length_code = -1;
        var data_start = 6;
        var mask;
        var fin = (data[0] & 128) >> 7;
        var op = data[0] & 15;

        if (data.length > 1)
          length_code = data[1] & 127;
        if (length_code > 125) {
          if ((length_code == 126 && data.length > 7) ||
              (length_code == 127 && data.length > 14)) {
            if (length_code == 126) {
              length_code = data[2] * 256 + data[3];
              mask = data.slice(4, 8);
              data_start = 8;
            } else if (length_code == 127) {
              length_code = 0;
              for (var i = 0; i < 8; i++) {
                length_code = length_code * 256 + data[2 + i];
              }
              mask = data.slice(10, 14);
              data_start = 14;
            }
          } else {
            length_code = -1; // Insufficient data to compute length
          }
        } else {
          if (data.length > 5)
            mask = data.slice(2, 6);
        }

        if (length_code > -1 && data.length >= data_start + length_code) {
          var decoded = data.slice(data_start, data_start + length_code).map(function(byte, index) {
            return byte ^ mask[index % 4];
          });
          if (op == 1) {
            decoded = ary2utf8(decoded);
          }
          data = data.slice(data_start + length_code);
          if (fin && op > 0) {
            // Unfragmented message.
            if (!t.onFrame_(op, decoded))
              return;
          } else {
            // Fragmented message.
            fragmentedOp = fragmentedOp || op;
            fragmentedMessages.push(decoded);
            if (fin) {
              var joinMessage = null;
              if (op == 1) {
                joinMessage = fragmentedMessagess.join('');
              } else {
                joinMessage = fragmentedMessages.reduce(function(pre, cur) {
                  return Array.prototype.push.apply(pre, cur);
                }, []);
              }
              if (!t.onFrame_(fragmentedOp, joinMessage))
                return;
              fragmentedOp = 0;
              fragmentedMessages = [];
            }
          }
        } else {
          break; // Insufficient data, wait for more.
        }
      }

      return t.pSocket_.read().then(onDataRead);
    };

    this.pSocket_.read().then(function(data) {
      return onDataRead(data);
    }).catch(function(e) {
      t.close_();
    });
  },

  onFrame_: function(op, data) {
    if (op == 1 || op == 2) {
      if (typeof data == 'string' || data instanceof String) {
        // Don't do anything.
      } else if (Array.isArray(data)) {
        data = new Uint8Array(data).buffer;
      } else if (data instanceof ArrayBuffer) {
        // Don't do anything.
      } else {
        data = data.buffer;
      }
      this.dispatchEvent('message', {'data': data});
    } else if (op == 8) {
      // A close message must be confirmed before the websocket is closed.
      if (this.readyState === 1) {
        this.sendFrame_(8);
        this.readyState = 2;
      } else {
        this.close_();
        return false;
      }
    }
    return true;
  },

  sendFrame_: function(op, data) {
    var t = this;
    var WebsocketFrameData = function(op, data) {
      var ary = data;
      if (typeof data == 'string' || data instanceof String) {
        ary = utf82ary(data);
      }
      if (Array.isArray(ary)) {
        ary = new Uint8Array(ary);
      }
      if (ary instanceof ArrayBuffer) {
        ary = new Uint8Array(ary);
      }
      ary = new Uint8Array(ary.buffer);
      var length = ary.length;
      if (ary.length > 65535)
        length += 10;
      else if (ary.length > 125)
        length += 4;
      else
        length += 2;
      var lengthBytes = 0;
      var buffer = new ArrayBuffer(length);
      var bv = new Uint8Array(buffer);
      bv[0] = 128 | (op & 15); // Fin and type text.
      bv[1] = ary.length > 65535 ? 127 :
              (ary.length > 125 ? 126 : ary.length);
      if (ary.length > 65535)
        lengthBytes = 8;
      else if (ary.length > 125)
        lengthBytes = 2;
      var len = ary.length;
      for (var i = lengthBytes - 1; i >= 0; i--) {
        bv[2 + i] = len & 255;
        len = len >> 8;
      }
      var dataStart = lengthBytes + 2;
      for (var i = 0; i < ary.length; i++) {
        bv[dataStart + i] = ary[i];
      }
      return buffer;
    }
    var array = WebsocketFrameData(op, data || '');
    this.pSocket_.write(array).then(function(bytesWritten) {
      if (bytesWritten !== array.byteLength)
        throw new Error('insufficient write');
    }).catch(function(e) {
      t.close_();
    });
  },

  close_: function() {
    if (this.readyState !== 3) {
      this.pSocket_.close();
      this.readyState = 3;
      this.dispatchEvent('close');
    }
  }
};

return {
  'Server': HttpServer,
  'WebSocketServer': WebSocketServer,
};
}();
