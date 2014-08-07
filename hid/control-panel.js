(function() {
  var ui = {
    deviceSelector: null,
    connect: null,
    disconnect: null,
    outId: null,
    outData: null,
    outSize: null,
    outPad: null,
    send: null,
    inSize: null,
    inPoll: null,
    inputLog: null,
    receive: null,
    clear: null,
  };

  var connection = -1;
  var deviceMap = {};
  var pendingDeviceMap = {};

  var initializeWindow = function() {
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    enableIOControls(false);
    ui.connect.addEventListener('click', onConnectClicked);
    ui.disconnect.addEventListener('click', onDisconnectClicked);
    ui.send.addEventListener('click', onSendClicked);
    ui.inPoll.addEventListener('change', onPollToggled);
    ui.receive.addEventListener('click', onReceiveClicked);
    ui.clear.addEventListener('click', onClearClicked);
    enumerateDevices();
  };

  var enableIOControls = function(ioEnabled) {
    ui.deviceSelector.disabled = ioEnabled;
    ui.connect.style.display = ioEnabled ? 'none' : 'inline';
    ui.disconnect.style.display = ioEnabled ? 'inline' : 'none';
    ui.inPoll.disabled = !ioEnabled;
    ui.send.disabled = !ioEnabled;
    ui.receive.disabled = !ioEnabled;
  };

  var pendingDeviceEnumerations;
  var enumerateDevices = function() {
    var deviceIds = [];
    var permissions = chrome.runtime.getManifest().permissions;
    for (var i = 0; i < permissions.length; ++i) {
      var p = permissions[i];
      if (p.hasOwnProperty('usbDevices')) {
        deviceIds = deviceIds.concat(p.usbDevices);
      }
    }
    pendingDeviceEnumerations = 0;
    pendingDeviceMap = {};
    for (var i = 0; i < deviceIds.length; ++i) {
      ++pendingDeviceEnumerations;
      chrome.hid.getDevices(deviceIds[i], onDevicesEnumerated);
    }
  };

  var onDevicesEnumerated = function(devices) {
    for (var i = 0; i < devices.length; ++i) {
      pendingDeviceMap[devices[i].deviceId] = devices[i];
    }
    --pendingDeviceEnumerations;
    if (pendingDeviceEnumerations === 0) {
      var selectedIndex = ui.deviceSelector.selectedIndex;
      while (ui.deviceSelector.options.length)
        ui.deviceSelector.options.remove(0);
      deviceMap = pendingDeviceMap;
      for (var k in deviceMap) {
        ui.deviceSelector.options.add(
            new Option("Device #" + k + " [" +
                       deviceMap[k].vendorId.toString(16) + ":" +
                       deviceMap[k].productId.toString(16) + "]", k));
      }
      ui.deviceSelector.selectedIndex = selectedIndex;
      setTimeout(enumerateDevices, 1000);
    }
  };

  var onConnectClicked = function() {
    var selectedDevice = ui.deviceSelector.value;
    var deviceInfo = deviceMap[selectedDevice];
    if (!deviceInfo)
      return;
    chrome.hid.connect(deviceInfo.deviceId, function(connectInfo) {
      if (!connectInfo) {
        console.warn("Unable to connect to device.");
      }
      connection = connectInfo.connectionId;
      enableIOControls(true);
    });
  };

  var onDisconnectClicked = function() {
    if (connection === -1)
      return;
    chrome.hid.disconnect(connection, function() {});
    enableIOControls(false);
  };

  var onSendClicked = function() {
    var id = +ui.outId.value;
    var bytes = new Uint8Array(+ui.outSize.value);
    var contents = ui.outData.value;
    contents = contents.replace(/\\x(\d\d)/g, function(match, capture) {
      return String.fromCharCode(parseInt(capture, 16));
    });
    for (var i = 0; i < contents.length && i < bytes.length; ++i) {
      if (contents.charCodeAt(i) > 255) {
        throw "I am not smart enough to decode non-ASCII data.";
      }
      bytes[i] = contents.charCodeAt(i);
    }
    var pad = +ui.outPad.value;
    for (var i = contents.length; i < bytes.length; ++i) {
      bytes[i] = pad;
    }
    ui.send.disabled = true;
    chrome.hid.send(connection, id, bytes.buffer, function() {
      ui.send.disabled = false;
    });
  };

  var isReceivePending = false;
  var pollForInput = function() {
    var size = +ui.inSize.value;
    isReceivePending = true;
    chrome.hid.receive(connection, size, function(data) {
      isReceivePending = false;
      logInput(new Uint8Array(data));
      if (ui.inPoll.checked) {
        setTimeout(pollForInput, 0);
      }
    });
  };

  var enablePolling = function(pollEnabled) {
    ui.inPoll.checked = pollEnabled;
    if (pollEnabled && !isReceivePending) {
      pollForInput();
    }
  };

  var onPollToggled = function() {
    enablePolling(ui.inPoll.checked);
  };

  var onReceiveClicked = function() {
    enablePolling(false);
    if (!isReceivePending) {
      pollForInput();
    }
  };

  var byteToHex = function(value) {
    if (value < 16)
      return '0' + value.toString(16);
    return value.toString(16);
  };

  var logInput = function(bytes) {
    var log = '';
    for (var i = 0; i < bytes.length; i += 16) {
      var sliceLength = Math.min(bytes.length - i, 16);
      var lineBytes = new Uint8Array(bytes.buffer, i, sliceLength);
      for (var j = 0; j < lineBytes.length; ++j) {
        log += byteToHex(lineBytes[j]) + ' ';
      }
      for (var j = 0; j < lineBytes.length; ++j) {
        var ch = String.fromCharCode(lineBytes[j]);
        if (lineBytes[j] < 32 || lineBytes[j] > 126)
          ch = '.';
        log += ch;
      }
      log += '\n';
    }
    log += "================================================================\n";
    ui.inputLog.textContent += log;
    ui.inputLog.scrollTop = ui.inputLog.scrollHeight;
  };

  var onClearClicked = function() {
    ui.inputLog.textContent = "";
  };

  window.addEventListener('load', initializeWindow);
}());
