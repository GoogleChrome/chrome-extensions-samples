//const device = '/dev/tty.usbserial-A100DUTY';
const device = '/dev/tty.usbmodem621';
const serial = chrome.serial;
const timeout = 100;

function SerialConnection() {
  this.connectionId = -1;
  this.callbacks = {};
}

SerialConnection.prototype.connect = function(device, callback) {
  serial.open(device, this.onOpen.bind(this))
  this.callbacks.connect = callback;
};

SerialConnection.prototype.read = function(callback) {
  // Only works for open serial ports.
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.read(this.connectionId, 1, this.onRead.bind(this));
  this.callbacks.read = callback;
};

SerialConnection.prototype.readLine = function(callback) {
  // Only works for open serial ports.
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  var line = '';

  // Keep reading bytes until we've found a newline.
  var readLineHelper = function(readInfo) {
    var char = readInfo.message;
    if (char == '') {
      // Nothing in the buffer. Try reading again after a small timeout.
      setTimeout(function() {
        this.read(readLineHelper);
      }.bind(this), timeout);
      return;
    }
    if (char == '\n') {
      // End of line.
      callback(line);
      line = '';
    }
    line += char;
    this.read(readLineHelper)
  }.bind(this)

  this.read(readLineHelper);
};

SerialConnection.prototype.write = function(msg, callback) {
  // Only works for open serial ports.
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  this.callbacks.write = callback;
  this._stringToArrayBuffer(msg, function(array) {
    serial.write(this.connectionId, array, this.onWrite.bind(this));
  }.bind(this));
};

SerialConnection.prototype.onOpen = function(connectionInfo) {
  this.connectionId = connectionInfo.connectionId;
  if (this.callbacks.connect) {
    this.callbacks.connect();
  }
};

SerialConnection.prototype.onRead = function(readInfo) {
  if (this.callbacks.read) {
    this.callbacks.read(readInfo);
  }
};

SerialConnection.prototype.onWrite = function(writeInfo) {
  log('wrote:' + writeInfo.bytesWritten);
  if (this.callbacks.write) {
    this.callbacks.write(writeInfo);
  }
};

/** From tcp-client */
SerialConnection.prototype._arrayBufferToString = function(buf, callback) {
  var blob = new Blob([buf]);
  var f = new FileReader();
  f.onload = function(e) {
    callback(e.target.result)
  }
  f.readAsText(blob);
}

SerialConnection.prototype._stringToArrayBuffer = function(str, callback) {
  var blob = new Blob([str]);
  var f = new FileReader();
  f.onload = function(e) {
    callback(e.target.result);
  }
  f.readAsArrayBuffer(blob);
}


////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var ser = new SerialConnection();
ser.connect(device, function() {
  log('connected to: ' + device);
  ser.write('hello arduino', function() {
  });
  readNextLine();
});

function readNextLine() {
  ser.readLine(function(line) {
    log('readline: ' + line);
    readNextLine();
  });
}

function log(msg) {
  var buffer = document.querySelector('#buffer');
  buffer.innerHTML += msg + '<br/>';
}

var is_on = false;
document.querySelector('button').addEventListener('click', function() {
  is_on = !is_on;
  ser.write(is_on ? 'y' : 'n');
});
