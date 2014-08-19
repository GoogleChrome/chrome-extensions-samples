(function() {
  var ui = {
    r: null,
    g: null,
    b: null
  };

  var connection = -1;

  function initializeWindow() {
    for (var k in ui) {
      var id = k.replace(/([A-Z])/, '-$1').toLowerCase();
      var element = document.getElementById(id);
      if (!element) {
        throw "Missing UI element: " + k;
      }
      ui[k] = element;
    }
    setGradients();
    enableControls(false);
    ui.r.addEventListener('change', onColorChanged);
    ui.g.addEventListener('change', onColorChanged);
    ui.b.addEventListener('change', onColorChanged);
    enumerateDevices();
  };

  function enableControls(enabled) {
    ui.r.disabled = !enabled;
    ui.g.disabled = !enabled;
    ui.b.disabled = !enabled;
  };

  function enumerateDevices() {
    chrome.hid.getDevices(
        { "vendorId": 10168, "productId": 493 },
        onDevicesEnumerated);
  };

  function onDevicesEnumerated(devices) {
    if (!devices) {
      console.warn("Unable to enumerate devices: " +
                   chrome.runtime.lastError.message);
      return;
    }

    chrome.hid.connect(devices[0].deviceId, onDeviceConnected);
  };

  function onDeviceConnected(connectInfo) {
    if (!connectInfo) {
      console.warn("Unable to connect to device: " +
                   chrome.runtime.lastError.message);
    }
    connection = connectInfo.connectionId;
    enableControls(true);
  };

  function onColorChanged() {
    setGradients();
    var fade_time = 500 / 10;  // 500 milliseconds
    var th = (fade_time & 0xff00) >> 8;
    var tl = fade_time & 0x00ff;
    var data = new Uint8Array(8);
    data[0] = 'c'.charCodeAt(0);
    data[1] = ui.r.value;
    data[2] = ui.g.value;
    data[3] = ui.b.value;
    data[4] = th;
    data[5] = tl;
    data[6] = 0;
    chrome.hid.sendFeatureReport(
        connection, 1, data.buffer, onTransferComplete);
  }

  function onTransferComplete() {
    if (chrome.runtime.lastError) {
      console.warn("Unable to set feature report: " +
                   chrome.runtime.lastError.message);
    }
  }

  function setGradients() {
    var r = ui.r.value, g = ui.g.value, b = ui.b.value;
    ui.r.style.background =
       'linear-gradient(to right, rgb(0, ' + g + ', ' + b + '), ' +
                                 'rgb(255, ' + g + ', ' + b + '))';
    ui.g.style.background =
       'linear-gradient(to right, rgb(' + r + ', 0, ' + b + '), ' +
                                 'rgb(' + r + ', 255, ' + b + '))';
    ui.b.style.background =
       'linear-gradient(to right, rgb(' + r + ', ' + g + ', 0), ' +
                                 'rgb(' + r + ', ' + g + ', 255))';
  }

  window.addEventListener('load', initializeWindow);
}());
