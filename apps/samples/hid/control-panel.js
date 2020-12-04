(function() {
  var ui = {
    deviceSelector: null,
    connect: null,
    disconnect: null,
    addDevice: null,
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
    ui.addDevice.addEventListener('click', onAddDeviceClicked);
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

  var enumerateDevices = function() {
    chrome.hid.getDevices({}, onDevicesEnumerated);
    chrome.hid.onDeviceAdded.addListener(onDeviceAdded);
    chrome.hid.onDeviceRemoved.addListener(onDeviceRemoved);
  };

  var onDevicesEnumerated = function(devices) {
    if (chrome.runtime.lastError) {
      console.error("Unable to enumerate devices: " +
                    chrome.runtime.lastError.message);
      return;
    }

    for (var device of devices) {
      onDeviceAdded(device);
    }
  }

  var onDeviceAdded = function(device) {
    var optionId = 'device-' + device.deviceId;
    if (ui.deviceSelector.namedItem(optionId)) {
      return;
    }

    var selectedIndex = ui.deviceSelector.selectedIndex;
    var option = document.createElement('option');
    option.text = "Device #" + device.deviceId + " [" +
                  device.vendorId.toString(16) + ":" +
                  device.productId.toString(16) + "]";
    option.id = optionId;
    ui.deviceSelector.options.add(option);
    if (selectedIndex != -1) {
      ui.deviceSelector.selectedIndex = selectedIndex;
    }
  };

  var onDeviceRemoved = function(deviceId) {
    var option = ui.deviceSelector.options.namedItem('device-' + deviceId);
    if (!option) {
      return;
    }

    if (option.selected) {
      onDisconnectClicked();
    }
    ui.deviceSelector.remove(option.index);
  };

  var onConnectClicked = function() {
    var selectedItem = ui.deviceSelector.options[ui.deviceSelector.selectedIndex];
    if (!selectedItem) {
      return;
    }
    var deviceId = parseInt(selectedItem.id.substr('device-'.length), 10);
    if (!deviceId) {
      return;
    }
    chrome.hid.connect(deviceId, function(connectInfo) {
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
    chrome.hid.disconnect(connection, function() {
      connection = -1;
    });
    enableIOControls(false);
  };

  var onAddDeviceClicked = function() {
    chrome.hid.getUserSelectedDevices({ 'multiple': false },
        function(devices) {
      if (chrome.runtime.lastError != undefined) {
        console.warn('chrome.hid.getUserSelectedDevices error: ' +
                     chrome.runtime.lastError.message);
        return;
      }
      for (var device of devices) {
        onDeviceAdded(device);
      }
    });
  };

  var onSendClicked = function() {
    var id = +ui.outId.value;
    var bytes = new Uint8Array(+ui.outSize.value);
    var contents = ui.outData.value;
    contents = contents.replace(/\\x([a-fA-F0-9]{2})/g, function(match, capture) {
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
    chrome.hid.receive(connection, function(reportId, data) {
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
