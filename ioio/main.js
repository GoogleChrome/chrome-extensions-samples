function log(msg) {
  var msg_str = (typeof(msg) == 'object') ? JSON.stringify(msg) : msg;
  console.log(msg_str);

  var l = document.getElementById('log');
  if (l) {
    l.innerText += msg_str + '\n';
  }
}

var kUUID = '00001101-0000-1000-8000-00805f9b34fb';

var level = 1;
var pin = 0;
function runAtInterval(socket) {
  return function() {
    var buffer = new ArrayBuffer(4);
    var view = new Uint8Array(buffer);

    // Set the level of pin0 to level
    // constants taken from here:
    // https://github.com/ytai/ioio/wiki/
    view[2] = 4;
    view[3] = pin << 2 | level;
    level = (level == 0) ? 1 : 0;

    chrome.bluetooth.write({socketId:socket.id, data:buffer},
        function(bytes) {
          if (chrome.runtime.lastError) {
            log('Write error: ' + chrome.runtime.lastError.message);
          } else {
            log('wrote ' + bytes + ' bytes');
          }
        });
  };
}

var socketId_;
var intervalId_;
var connectCallback = function(socket) {
  if (socket) {
    log('Connected!  Socket ID is: ' + socket.id + ' on service ' +
        socket.serviceUuid);
    socketId_ = socket.id;

    // Set pin0 as output.
    var buffer = new ArrayBuffer(2);
    var view = new Uint8Array(buffer);
    // constants taken from here:
    // https://github.com/ytai/ioio/wiki/
    view[0] = 3;
    view[1] = pin << 2 | 2;
    chrome.bluetooth.write({socketId:socket.id, data:buffer},
        function(bytes) {
          if (chrome.runtime.lastError) {
            log('Write error: ' + chrome.runtime.lastError.message);
          } else {
            log('wrote ' + bytes + ' bytes');
          }
        });

    intervalId_ = window.setInterval(runAtInterval(socket), 1000);
  } else {
    log('Failed to connect.');
  }
};

var connectToDevice = function(result) {
  if (chrome.runtime.lastError) {
    log('Error searching for a device to connect to.');
    return;
  }
  if (result.length == 0) {
    log('No devices found to connect to.');
    return;
  }
  for (var i in result) {
    var device = result[i];
    log('Connecting to device: ' + device.name + ' @ ' + device.address);
    chrome.bluetooth.connect(
        {deviceAddress: device.address, serviceUuid: kUUID}, connectCallback);
  }
};

log('Starting IOIO demo...');
chrome.bluetooth.getDevices({uuid: kUUID}, connectToDevice);
