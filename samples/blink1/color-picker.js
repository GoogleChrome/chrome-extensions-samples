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
    ui.r.addEventListener('input', onColorChanged);
    ui.g.addEventListener('input', onColorChanged);
    ui.b.addEventListener('input', onColorChanged);
    enumerateDevices();
  };

  function enableControls(enabled) {
    ui.r.disabled = !enabled;
    ui.g.disabled = !enabled;
    ui.b.disabled = !enabled;
  };

  function enumerateDevices() {
    chrome.hid.getDevices(
        { "filters": [ { "vendorId": 10168, "productId": 493 } ] },
        onDevicesEnumerated);
  };

  function onDevicesEnumerated(devices) {
    if (!devices) {
      console.warn("Unable to enumerate devices: " +
                   chrome.runtime.lastError.message);
      return;
    }

    if (devices.length < 1) {
      console.warn("No devices found.");
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

  function fadeRGB(r, g, b, fade_ms, led) {
    // Send a fade command to the blink(1). The command protocol operates over
    // feature reports and is documented here:
    //
    // https://github.com/todbot/blink1/blob/master/docs/blink1-hid-commands.md

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
    chrome.hid.sendFeatureReport(connection, 1, data.buffer, function() {
      if (chrome.runtime.lastError) {
        console.warn("Unable to set feature report: " +
                     chrome.runtime.lastError.message);
      }
    });
  }

  function onColorChanged() {
    setGradients();
    fadeRGB(ui.r.value, ui.g.value, ui.b.value, 250, 0);
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
