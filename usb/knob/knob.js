var POWERMATE_VENDOR_ID = 1917;//0x077d;
var POWERMATE_PRODUCT_ID = 1040; //0x0410;
var DEVICE_INFO = {"vendorId": POWERMATE_VENDOR_ID, "productId": POWERMATE_PRODUCT_ID};

var powerMateDevice;
var usb = chrome.usb;
var knob = document.getElementById('knob');
var requestButton = document.getElementById("requestPermission");

var amount = 0;

var transfer = {
  direction: 'in',
  endpoint: 1,
  length: 6
};

var onEvent=function(usbEvent) {
    if (usbEvent.resultCode) {
      console.log("Error: " + usbEvent.error);
      return;
    }

    var buffer = new Int8Array(usbEvent.data);
    amount += buffer[1] * 4;

    knob.style.webkitTransform = 'rotate(' + amount + 'deg)';

    usb.interruptTransfer( powerMateDevice, transfer, onEvent );
  };

var gotPermission = function(result) {
    requestButton.style.display = 'none';
    knob.style.display = 'block';
    console.log('App was granted the "usbDevices" permission.');
    usb.findDevices( DEVICE_INFO, 
      function(devices) {
        if (!devices || !devices.length) {
          console.log('device not found');
          return;
        }
        console.log('Found device: ' + devices[0].handle);
        powerMateDevice = devices[0];
        usb.interruptTransfer(powerMateDevice, transfer, onEvent);
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

chrome.permissions.contains( permissionObj, function(result) {
  if (result) {
    gotPermission();
  }
});

