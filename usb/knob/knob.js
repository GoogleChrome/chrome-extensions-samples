var POWERMATE_VENDOR_ID = 1917; //0x077d;
var POWERMATE_PRODUCT_ID = 1040; //0x0410;
var DEVICE_INFO = {"vendorId": POWERMATE_VENDOR_ID, "productId": POWERMATE_PRODUCT_ID};

var powerMateDevice;
var knob = document.getElementById('knob');
var requestButton = document.getElementById("requestPermission");

var amount = 0;
var ROTATE_DEGREE = 4;

var transfer = {
  direction: 'in',
  endpoint: 1,
  length: 6
};

var onEvent = function(usbEvent) {
    
    if (usbEvent.resultCode) {
      console.log("Error: " + usbEvent.error);
      return;
    }

    var dv = new DataView(usbEvent.data);
    var knobState = {
      _ledStatus: dv.getUint8(4),
      buttonState: dv.getUint8(0),
      knobDisplacement: dv.getInt8(1),
      ledBrightness: dv.getUint8(3),
      pulseEnabled: (dv.getUint8(4) & 1) == 1,
      pulseWhileAsleep: (dv.getUint8(4) & 4) == 4,
      pulseSpeed: null,
      pulseStyle: null,
      ledMultiplier: dv.getUint8(5)
    };

    knobState.pulseSpeed = pulseDescriptionFromStatusByte(
      knobState, ["slower", "normal", "faster"], 4);

    knobState.pulseStyle = pulseDescriptionFromStatusByte(
      knobState, ["style1", "style2", "style3"], 6);

    var transform = '';
    if (knobState.buttonState == 1) {
      transform = 'scale(0.5) ';
    }

    amount += (knobState.knobDisplacement * ROTATE_DEGREE);
    transform += 'rotate(' + amount + 'deg)';
    knob.style.webkitTransform = transform;
    
    console.log("RotateEvent", knobState);

    chrome.usb.interruptTransfer(powerMateDevice, transfer, onEvent);
  };

var pulseDescriptionFromStatusByte = function(knobState, descriptions, offset) {
    if(descriptions && offset >= 0 && offset < 8) {
      var index = (knobState._ledStatus >> offset) & 3;
      if(descriptions.length > index) {
        return descriptions[index];
      }
    }

    return "unknown";
  };

var gotPermission = function(result) {
    requestButton.style.display = 'none';
    knob.style.display = 'block';
    console.log('App was granted the "usbDevices" permission.');
    chrome.usb.findDevices( DEVICE_INFO,
      function(devices) {
        if (!devices || !devices.length) {
          console.log('device not found');
          return;
        }
        console.log('Found device: ' + devices[0].handle);
        powerMateDevice = devices[0];
        chrome.usb.interruptTransfer(powerMateDevice, transfer, onEvent);
    });
  };

var permissionObj = {permissions: [{'usbDevices': [DEVICE_INFO] }]};

requestButton.addEventListener('click', function() {
  chrome.permissions.request( permissionObj, function(result) {
    if (result) {
      gotPermission();
    } else {
      console.log('App was not granted the "usbDevices" permission.');
      console.log(chrome.runtime.lastError);
    }
  });
});

chrome.permissions.contains(permissionObj, function(result) {
  if (result) {
    gotPermission();
  }
});

function setLEDBrightness(brightness) {
  if ((brightness >= 0) && (brightness <= 255)) {
    var info = {
      "direction": "out",
      "endpoint": 2,
      "data": new Uint8Array([brightness]).buffer
    };
    chrome.usb.interruptTransfer(powerMateDevice, info, sendCompleted);
  } else {
    console.error("Invalid brightness setting (0-255)", brightness);
  }
}

function enablePulse(val) {
  if (val === true) {
    sendCommand(1, 3, 1);
  } else {
    sendCommand(1, 3, 0);
  }
}

function enablePulseDuringSleep(val) {
  if (val === true) {
    sendCommand(1, 2, 1);
  } else {
    sendCommand(1, 2, 0);
  }
}

function sendCommand(request, val, idx) {
  var ti = {
    "requestType": "vendor",
    "recipient": "interface",
    "direction": "out",
    "request": request,
    "value": val,
    "index": idx,
    "data": new ArrayBuffer(0)
  };
  chrome.usb.controlTransfer(powerMateDevice, ti, sendCompleted);
}

function sendCompleted(usbEvent) {
  if (chrome.runtime.lastError) {
    console.error("sendCompleted Error:", chrome.runtime.lastError);
  }

  if (usbEvent) {
    if (usbEvent.data) {
      var buf = new Uint8Array(usbEvent.data);
      console.log("sendCompleted Buffer:", usbEvent.data.byteLength, buf);
    }
    if (usbEvent.resultCode !== 0) {
      console.error("Error writing to device", usbEvent.resultCode);
    }
  }
}


/* some fun commands to try:
 *   sendCommand(1, 0x0104, 0x3002) // fast flashing
 *   sendCommand(1, 0x0104, 0xff02) // fastest flashing possible
 *   sendCommand(1, 0x0104, 0xff01) // normal speed flashing
 *   sendCommand(1, 0x0104, 0x0f00) // super slow flashing
 */