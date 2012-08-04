var POWERMATE_VENDOR_ID = 0x077d;
var POWERMATE_PRODUCT_ID = 0x0410;

var powerMateDevice;
var usb = chrome.experimental.usb;

var amount = 0;

var transfer = {
  direction: 'in',
  endpoint: 1,
  length: 6
};

var deviceOptions = {
  onEvent: function(usbEvent) {
    if (usbEvent.resultCode) {
      console.log("Error: " + usbEvent.error);
      return;
    }

    var buffer = new Int8Array(usbEvent.data);
    amount += buffer[1] * 4;

    var knob = document.getElementById('knob');
    knob.style.webkitTransform = 'rotate(' + amount + 'deg)';

    usb.interruptTransfer(
        powerMateDevice,
        transfer,
        function() {
          console.log('Sent event transfer');
        });
  }
};

usb.findDevice(
    POWERMATE_VENDOR_ID,
    POWERMATE_PRODUCT_ID,
    deviceOptions,
    function(device) {
      if (!device) {
        console.log('device not found');
        return;
      }
      console.log('Found device: ' + device.handle);
      powerMateDevice = device;
      usb.interruptTransfer(powerMateDevice, transfer, function() {
        console.log('Sent initial transfer');
      });
    });
