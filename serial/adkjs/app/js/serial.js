/**
Copyright 2013 Google Inc.

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
Author: Luis Leao (luisleao@gmail.com)
Author: Ken Rockot (rockot@chromium.org)
**/

var serial_lib = (function() {
  var logObj = function(obj) {
    console.log(obj);
  }

  var log = function(msg) {
    console.log(msg);
  };

  // Enapsulates an active serial device connection.
  var DeviceConnection = function(connectionId) {
    var onReceive = new chrome.Event();
    var onError = new chrome.Event();
    var onClose = new chrome.Event();
    var send = function(msg) {
      chrome.serial.send(connectionId, str2ab(msg), function() {});
    };
    var close = function() {
      chrome.serial.disconnect(connectionId, function(success) {
        if (success) {
          onClose.dispatch();
        }
      });
    };
    chrome.serial.onReceive.addListener(function(receiveInfo) {
      if (receiveInfo.connectionId === connectionId) {
        onReceive.dispatch(ab2str(receiveInfo.data));
      }
    });
    chrome.serial.onReceiveError.addListener(function(errorInfo) {
      if (errorInfo.connectionId === connectionId) {
        onError.dispatch(errorInfo.error);
      }
    });
    return {
      "onReceive": onReceive,
      "onError": onError,
      "onClose": onClose,
      "send": send,
      "close": close
    };
  };

  var getDevices = function(callback) {
    chrome.serial.getDevices(callback);
  };

  var openDevice = function(path, callback) {
    chrome.serial.connect(path, { bitrate: 57600 }, function(connectionInfo) {
      var device = null;
      if (connectionInfo) {
        device = new DeviceConnection(connectionInfo.connectionId);
      }
      callback(device);
    });
  };
  
  /* Interprets an ArrayBuffer as UTF-8 encoded string data. */
  var ab2str = function(buf) {
    var bufView = new Uint8Array(buf);
    var encodedString = String.fromCharCode.apply(null, bufView);
    return decodeURIComponent(escape(encodedString));
  };

  /* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
  var str2ab = function(str) {
    var encodedString = unescape(encodeURIComponent(str));
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
      bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  return {
    "getDevices": getDevices,
    "openDevice": openDevice,
  };
}());

