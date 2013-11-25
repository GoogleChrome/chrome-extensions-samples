var servo = {

  connectionId: -1,

  onSend: function(sendInfo) {
    if (sendInfo.bytesSent == -1) {
      servo.fail('Could not write to serial device.');
    }
  },

  setPosition: function(position) {
    var buffer = new ArrayBuffer(1);
    var uint8View = new Uint8Array(buffer);
    uint8View[0] = 48 + position;
    chrome.serial.send(servo.connectionId, buffer, servo.onSend);
  },

  onOpen: function(connectionInfo) {
    if (!connectionInfo) {
      servo.fail('Could not open device');
      return;
    }
    servo.connectionId = connectionInfo.connectionId;

    console.log('opened, got connection id: ' + servo.connectionId);
    servo.setPosition(0);
  },

  onGetDevices: function(ports) {
    var eligiblePorts = ports.filter(function(port) {
      if (servo.shouldSkipPort(port.path)) {
        console.log('Skipping port ' + port.path);
        return false;
      }

      console.log('Maybe using port ' + port.path);
      return true;
    });

    if (eligiblePorts.length == 0) {
      servo.fail('Serial port not found.');
      return;
    }

    var port = eligiblePorts[eligiblePorts.length - 1];
    if (eligiblePorts.length > 1) {
      servo.fail(eligiblePorts.length + ' eligible ports found, trying ' + port.path);
    }

    chrome.serial.connect(port.path, servo.onOpen);
  },

  onSliderChange: function() {
    var value = parseInt(this.value);
    servo.setPosition(value);
  },

  shouldSkipPort: function(portName) {
    if (navigator.platform.indexOf('Linux') == 0) {
      return !portName.match(/ACM/);
    }
    return portName.match(/[Bb]luetooth/);
  },

  init: function() {
    if (servo.connectionId != -1) {
      chrome.serial.disconnect(servo.connectionId, function() {
        servo.connectionId = -1;
        servo.init();
      });
      return;
    }
    document.getElementById('spinner-error').classList.remove('visible');
    document.getElementById('spinner-input').onchange = servo.onSliderChange;

    chrome.serial.getDevices(servo.onGetDevices);
  },

  shutDown: function() {
    if (servo.connectionId == -1) {
      return;
    }

    chrome.serial.disconnect(servo.connectionId, function() {
      servo.connectionId = -1;
    });
  },

  fail: function(message) {
    document.getElementById('spinner-error').classList.add('visible');
    document.getElementById('spinner-error').textContent = message;
  }
};
