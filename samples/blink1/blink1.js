function Blink1(deviceId) {
  this.deviceId = deviceId;
  this.connection = null;
};

Blink1.VENDOR_ID = 0x27B8;
Blink1.PRODUCT_ID = 0x01ED;

Blink1.prototype.connect = function(cb) {
  chrome.hid.connect(this.deviceId, function(connectionInfo) {
    if (chrome.runtime.lastError) {
      console.warn("Unable to connect device: " +
                   chrome.runtime.lastError.message);
      cb(false);
      return;
    }

    this.connection = connectionInfo.connectionId;
    cb(true);
  }.bind(this));
};

Blink1.prototype.disconnect = function(cb) {
  chrome.hid.disconnect(this.connection, function() {
    if (chrome.runtime.lastError) {
      console.warn("Unable to disconnect device: " +
                   chrome.runtime.lastError.message);
      cb(false);
      return;
    }

    cb(true);
  }.bind(this));
};

// The following functions send commands to the blink(1). The command protocol
// operates over feature reports and is documented here:
//
// https://github.com/todbot/blink1/blob/master/docs/blink1-hid-commands.md
//
// blink(1) HID feature reports are 8 bytes, though only the first 7 bytes
// appear to ever be read by the firmware. 8 bytes must be sent because some
// platforms require it (Windows). The documentation refers to sending the
// report ID as the first byte of the buffer, this is a detail of the HID
// transport layer and the firmware's HID library and is not reflected in the
// buffers sent here. This confusion is probably why the firmware only uses the
// first 7 bytes of the report.
//
// Be careful not to send multiple commands simultaneously as each command
// overwrites the buffer returned by a GET_REPORT(Feature) request and so the
// command result may be lost or misattributed.
//
// TODO(reillyeon): Add transparent request queueing to prevent this.

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
