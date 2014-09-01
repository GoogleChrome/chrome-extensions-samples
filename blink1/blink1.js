function Blink1(deviceId) {
  this.deviceId = deviceId;
};

Blink1.getDevices = function(cb) {
  chrome.hid.getDevices(
      { "filters": [ { "vendorId": 10168, "productId": 493 } ] },
      function(devices) {
    if (chrome.runtime.lastError) {
      console.warn("Unable to enumerate devices: " +
                   chrome.runtime.lastError.message);
      cb([]);
      return;
    }

    cb(devices.map(function(device) {
      return new Blink1(device.deviceId);
    }));
  });
};

Blink1.prototype.open = function(cb) {
  chrome.hid.connect(this.deviceId, function(connectionInfo) {
    if (connectionInfo) {
      this.connection = connectionInfo.connectionId;
      cb(true);
    } else {
      console.warn("Unable to open device: " +
                   chrome.runtime.lastError.message);
      cb(false);
    }
  }.bind(this));
};

// The following functions send commands to the blink(1). The command protocol
// operates over feature reports and is documented here:
//
// https://github.com/todbot/blink1/blob/master/docs/blink1-hid-commands.md

Blink1.prototype.fadeRgb = function(r, g, b, fade_ms, led) {
  var fade_time = fade_ms / 10;
  var th = (fade_time & 0xff00) >> 8;
  var tl = fade_time & 0x00ff;
  var data = new Uint8Array(8);
  data[0] = 'c'.charCodeAt(0);
  data[1] = r;
  data[2] = g;
  data[3] = b;
  data[4] = th;
  data[5] = tl;
  data[6] = led;
  chrome.hid.sendFeatureReport(this.connection, 1, data.buffer, function() {
    if (chrome.runtime.lastError) {
      console.warn("Unable to send fade command: " +
                   chrome.runtime.lastError.message);
    }
  });
};

Blink1.prototype.getRgb = function(led, cb) {
  var data = new Uint8Array(8);
  data[0] = 'r'.charCodeAt(0);
  data[6] = led;
  chrome.hid.sendFeatureReport(this.connection, 1, data.buffer, function() {
    if (chrome.runtime.lastError) {
      console.warn("Unable to send get command: " +
                   chrome.runtime.lastError.message);
      cb(undefined, undefined, undefined);
      return;
    }

    chrome.hid.receiveFeatureReport(this.connection, 1, function(buffer) {
      if (chrome.runtime.lastError) {
        console.warn("Unable to read get response: " +
                     chrome.runtime.lastError.message);
        cb(undefined, undefined, undefined);
        return;
      }

      var data = new Uint8Array(buffer);
      cb(data[2], data[3], data[4]);
    });
  }.bind(this));
};

Blink1.prototype.getVersion = function(cb) {
  var data = new Uint8Array(8);
  data[0] = 'v'.charCodeAt(0);
  chrome.hid.sendFeatureReport(this.connection, 1, data.buffer, function() {
    if (chrome.runtime.lastError) {
      console.warn("Unable to send version command: " +
                   chrome.runtime.lastError.message);
      cb(undefined);
      return;
    }

    chrome.hid.receiveFeatureReport(this.connection, 1, function(buffer) {
      if (chrome.runtime.lastError) {
        console.warn("Unable to read version response: " +
                     chrome.runtime.lastError.message);
        cb(undefined);
        return;
      }

      var data = new Uint8Array(buffer);
      cb(String.fromCharCode(data[3]) + "." + String.fromCharCode(data[4]));
    });
  }.bind(this));
};
