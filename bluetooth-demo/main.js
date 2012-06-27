function log(msg) {
  var l = document.getElementById('log');
  if (typeof(msg) == 'object') {
    l.innerText += JSON.stringify(msg) + '\n';
  } else {
    l.innerText += msg + '\n';
  }
  console.log(msg);
}

function logResult(tag) {
  return function(result) {
    log(tag + ':' + result);
  };
}

function checkError(tag) {
  return function() {
    if (chrome.extension.lastError) {
      log(tag + ' failed: ' + chrome.extension.lastError);
    } else {
      log(tag + ' succeeded.');
    }
  };
}

log('Starting bluetooth demo...');

/**
 * Listen to available events and log any changes.
 */
chrome.experimental.bluetooth.onAvailabilityChanged.addListener(
    function(result) {
      log('onAvailabilityChanged(' + result + ')');
    });
chrome.experimental.bluetooth.onPowerChanged.addListener(
    function(result) {
      log('onPowerChanged(' + result + ')');
    });

/**
 * Query the system for basic information.
 */
chrome.experimental.bluetooth.getAddress(
    logResult('getAddress'));
chrome.experimental.bluetooth.isAvailable(
    logResult('isAvailable'));
chrome.experimental.bluetooth.isPowered(
    logResult('isPowered'));

/**
 * Device discovery example.
 */
function deviceCallback(device) {
  if (chrome.extension.lastError) {
    log('Device discovered callback called with error: ' +
        chrome.extension.lastError);
  } else {
    log('Discovered device: ' + device.address + ' (' + device.name + ')');
  }
}

document.getElementById('start_discovery').addEventListener('click',
    function() {
      chrome.experimental.bluetooth.startDiscovery(
          {'deviceCallback': deviceCallback}, checkError('startDiscovery'));
    });
document.getElementById('stop_discovery').addEventListener('click',
    function() {
      chrome.experimental.bluetooth.stopDiscovery(checkError('stopDiscovery'));
    });

/**
 * Connect, read & write example
 *
 * NOTE: In order for this example to work a phone with the BluetoothEcho
 * application (ask bryeung) must be paired with the device.  This also
 * requires enabling "Unsupported bluetooth devices" in about:flags.
 */
var kUUID = '6e197870-8fae-11e1-b0c4-0800200c9a66';  // BluetoothEcho

var readIntervalId;
var readInterval = function (socket) {
  return function() {
    chrome.experimental.bluetooth.read({socketId:socket.id}, function(data) {
      if (chrome.extension.lastError) {
        log('Read error:');
        log(chrome.extension.lastError);
        window.clearInterval(readIntervalId);
      } else {
        if (data) {
          var chars = new Uint8Array(data);
          var s = 'read: ';
          for (var i = 0; i < data.byteLength; i++) {
            s += String.fromCharCode(chars[i]);
          }
          log(s);
        }
      }
    });
  }
}

function startEchoService(socket) {
  log('Starting reads');
  readIntervalId = window.setInterval(readInterval(socket), 1000);
}

function makeWriteFunction(socket) {
  return function() {
    var textField = document.getElementById('t');
    if (textField.value.length == 0) {
      return;
    }
    var buffer = new ArrayBuffer(textField.value.length);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < textField.value.length; i++) {
      view[i] = textField.value[i].charCodeAt();
    }

    chrome.experimental.bluetooth.write({socketId:socket.id, data:buffer},
        function(bytes) {
          if (chrome.extension.lastError) {
            log('Write error: ' + chrome.extension.lastError.message);
          } else {
            log('wrote ' + bytes + ' bytes');
          }
        });

    textField.value = '';
  };
}

var connectCallback = function(result) {
  if (result) {
    log('Connected!  Socket ID is: ' + result.id + ' on service ' +
        result.serviceUuid);
    startEchoService(result);

    document.getElementById('t').addEventListener('change',
        makeWriteFunction(result));
    document.getElementById('send').addEventListener('click',
        makeWriteFunction(result));
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
    log('Connecting to device: ' + device.name + ' @ ' + device.address);
    chrome.experimental.bluetooth.connect(
        {deviceAddress: device.address, serviceUuid: kUUID}, connectCallback);
  }
};

document.getElementById('connect').addEventListener('click',
    function() {
      chrome.experimental.bluetooth.getDevices({uuid: kUUID}, connectToDevice);
    });


/**
 * getServices example
 *
 * NOTE: same caveats apply as for the connect example above.
 */
function makeProcessServices(device) {
  return function(result) {
    if (chrome.extension.lastError) {
      log('Service discovery failed for ' + device.address);
      return;
    }
    log('Device ' + device.address + ' has services:');
    for (var i in result) {
      log('    ' + result[i].name + ' : ' + result[i].uuid);
    }
  };
}

var getServicesFromDevice = function(result) {
  if (chrome.extension.lastError) {
    log('Error searching for a device to query.');
    return;
  }
  if (result.length == 0) {
    log('No device found to query for services.');
    return;
  }
  for (var i in result) {
    var device = result[i];
    log('Discovered device: ' + device.address + ' (' + device.name + ')');
    chrome.experimental.bluetooth.getServices({deviceAddress:device.address},
        makeProcessServices(device));
  }
};

document.getElementById('services').addEventListener('click',
    function() {
      chrome.experimental.bluetooth.getDevices({uuid: kUUID},
          getServicesFromDevice);
    });
