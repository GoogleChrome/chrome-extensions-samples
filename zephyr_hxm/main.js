var READ_INTERVAL = 1000;

var _socket = null;
var _readIntervalId = null;

function init() {
  console.log("Starting Zephyr HXM demo...");

  document.getElementById("butDisconnect")
    .addEventListener("click", disconnect);
  document.getElementById("butConnect")
    .addEventListener("click", findAndConnect);
  document.getElementById("butQuit").addEventListener("click", closeApp);

  // Add the listener to deal with our initial connection
  chrome.bluetooth.onConnection.addListener(onConnected);

  // Check the paired Bluetooth devices then connect to the HXM
  findAndConnect();
}

/* 
 HXM Specific Function
*/

function updateHeartRate(heartrate) {
  document.getElementById("hr").innerText = heartrate;
  document.getElementById("graph")
    .contentWindow.postMessage({heartrate: heartrate}, "*");
}

function closeApp() {
  console.log("Close app.");
  disconnect();
  window.close();
}

function findAndConnect() {
  // Get's the device list, and passes that list to the connectToHXM
  // function as a callback.
  getDeviceList(connectToHXM);
}

function onConnected(socket) {
  console.log("onConnected", socket);
  if (socket) {
    _socket = socket;
    _readIntervalId = window.setInterval(function() {
      // Reads the data from the socket and passes it to parseHXMData 
      chrome.bluetooth.read({socket: _socket}, parseHXMData);
    }, READ_INTERVAL);
  } else {
    console.error("Failed to connect.");
  }
}

function parseHXMData(data) {
  
  // Data parsing is based on the code in the openzephyr library:
  // http://code.google.com/p/zephyropen/source/browse/zephyropen/src/zephyropen/device/zephyr/ZephyrUtils.java
  if ((data) && ((data.byteLength % 60) === 0)) {
    var offset = 0;
    while (offset + 60 <= data.byteLength) {
      var data_view = new Uint8Array(data, offset);
      offset += 60;

      if (data_view[0] != 2) {
        console.log('Check failed data[0] = ' + data_view[0]);
        continue;
      }

      if (data_view[1] != 38) {
        console.log('Check failed data[1] = ' + data_view[1]);
        continue;
      }

      if (data_view[2] != 55) {
        console.log('Check failed data[2] = ' + data_view[2]);
        continue;
      }

      if (data_view[59] != 3) {
        console.log('Check failed data[59] = ' + data_view[59]);
        continue;
      }

      var heartrate = data_view[12];
      if (heartrate < 30 || heartrate > 240) {
        console.log('Heartrate out of range (' + heartrate + ').  Discarding.');
        return;
      }

      updateHeartRate(heartrate);
    }
  } else {
    console.error("Error parsing data.", data, data.byteLength);
  }
}

function connectToHXM(deviceList) {
  console.log("connectToHXM", deviceList);
  if (deviceList !== null) {
    // Iterates through the device list looking for a device that starts with
    // HXM as it's name then tries to connect to that device.
    for (var i in deviceList) {
      var device = deviceList[i];
      if (device.name.indexOf("HXM") === 0) {
        console.log("Connecting to HXM", device);
        connect(device.address, HXM_PROFILE);
      }
    }
  }
}


/*
 Generic BlueTooth
*/

function getDeviceList(callback) {
  console.log("Searching for bluetooth devices...");
  var deviceList = [];

  // Get the BlueTooth adapter state and verify it's ready
  chrome.bluetooth.getAdapterState(function(adapterState) {
    if (adapterState.available && adapterState.powered) {
      
      // Gets the list of paired devices and adds each one to the deviceList
      // array, when done calls the callback with the list of devices.
      chrome.bluetooth.getDevices({
        deviceCallback: function(device) { deviceList.push(device); }
      }, function () {
        console.log("Devices found", deviceList);
        if (callback) {
          callback(deviceList);
        } else {
          console.error("No callback specified.");
        }
      });
    } else {
      // If the bluetooth adapter wasn't ready or is unavailble, return null
      console.log("Bluetooth adapter not ready or unavailable.");
      callback(null);
    }
  });
}

function connect(deviceAddress, profile) {
  console.log("Connecting to device", deviceAddress, profile);
  chrome.bluetooth.connect({
    device: {address: deviceAddress},
    profile: profile
  }, function() {
    if (chrome.runtime.lastError) {
      console.error("Error on connection.", chrome.runtime.lastError.message);
    }
  });
}

function disconnect() {
  console.log("End session.");
  if (_readIntervalId !== null) {
    console.log("Clearing interval.");
    clearInterval(_readIntervalId);
  }
  if (_socket !== null) {
    console.log("Disconnecting socket.");
    chrome.bluetooth.disconnect({socket: _socket}, function() {
      console.log("Socket closed.");
      _socket = null;
    });
  }
}

init();
