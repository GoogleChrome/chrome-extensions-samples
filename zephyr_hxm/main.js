function log(msg) {
  var msg_str = (typeof(msg) == 'object') ? JSON.stringify(msg) : msg;
  console.log(msg_str);

  var l = document.getElementById('log');
  if (l) {
    l.innerText += msg_str + '\n';
  }
}

function updateHeartRate(value) {
  document.getElementById('graph').contentWindow.postMessage(
      {heartrate: value}, '*');
}

var kUUID = '00001101-0000-1000-8000-00805f9b34fb';
var readIntervalId;
var readInterval = function (socket) {
  return function() {
    chrome.bluetooth.read({socketId:socket.id}, function(data) {
      if (chrome.extension.lastError) {
        log('Read error:');
        log(chrome.extension.lastError);
        window.clearInterval(readIntervalId);
      } else {
        // Data parsing is based on the code in the openzephyr library:
        // http://code.google.com/p/zephyropen/source/browse/zephyropen/src/zephyropen/device/zephyr/ZephyrUtils.java
        if (data) {
          if ((data.byteLength % 60) != 0) {
            log('Payload is wrong size (' + data.byteLength +
                ').  Discarding.');
            return;
          }

          var offset = 0;
          while (offset + 60 <= data.byteLength) {
            var data_view = new Uint8Array(data, offset);
            offset += 60;

            if (data_view[0] != 2) {
              log('Check failed data[0] = ' + data_view[0]);
              continue;
            }

            if (data_view[1] != 38) {
              log('Check failed data[1] = ' + data_view[1]);
              continue;
            }

            if (data_view[2] != 55) {
              log('Check failed data[2] = ' + data_view[2]);
              continue;
            }

            if (data_view[59] != 3) {
              log('Check failed data[59] = ' + data_view[59]);
              continue;
            }

            var heartrate = data_view[12];
            if (heartrate < 30 || heartrate > 240) {
              log('Heartrate out of range (' + heartrate + ').  Discarding.');
              return;
            }

            updateHeartRate(heartrate);
            log('HR=' + heartrate);
          }
        }
      }
    });
  }
}

function startReads(socket) {
  log('Starting reads');
  readIntervalId = window.setInterval(readInterval(socket), 1000);
}

var socketId_;
var connectCallback = function(socket) {
  if (socket) {
    log('Connected!  Socket ID is: ' + socket.id + ' on service ' +
        socket.serviceUuid);
    startReads(socket);
    socketId_ = socket.id;
  } else {
    log('Failed to connect.');
  }
};

var connectToDevice = function(result) {
  if (chrome.extension.lastError) {
    log('Error searching for a device to connect to.');
    return;
  }
  if (result.length == 0) {
    log('No devices found to connect to.');
    return;
  }
  for (var i in result) {
    var device = result[i];
    if (device.name == 'HXM014782') {
      log('Connecting to device: ' + device.name + ' @ ' + device.address);
      chrome.bluetooth.connect(
          {deviceAddress: device.address, serviceUuid: kUUID}, connectCallback);
    }
  }
};

log('Starting Zephyr HXM demo...');


var kSimulate = false;
if (kSimulate) {
  window.setInterval(function() {
    updateHeartRate(60 + Math.floor((Math.random()*10)+1));
  }, 1000);
} else {
  chrome.bluetooth.getDevices({uuid: kUUID}, connectToDevice);
}

document.getElementById('close').addEventListener('click',
    function() {
      if (!kSimulate) {
        chrome.bluetooth.disconnect({socketId:socketId_});
      }
      window.close();
    });
