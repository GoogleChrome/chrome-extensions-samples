var connectionId = -1;

var onWrite = function(writeInfo) {
};

var setPosition = function(position) {
  var buffer = new ArrayBuffer(1);
  var uint8View = new Uint8Array(buffer);
  uint8View[0] = 48 + position;
  chrome.experimental.serial.write(connectionId, buffer, onWrite);
};

var onRead = function(readInfo) {
  if (readInfo.bytesRead > 0) {
    var uint8View = new Uint8Array(readInfo.data);
    var charValue = uint8View[0];
    if (charValue != 13 && charValue != 10) {
      var value = uint8View[0] - 48;
      var rotation = value * 18.0;

      document.getElementById('image').style.webkitTransform =
        'rotateZ(' + rotation + 'deg)';
    }
  }

  // Keep on reading.
  chrome.experimental.serial.read(connectionId, onRead);
};

var onOpen = function(openInfo) {
  connectionId = openInfo.connectionId;
  if (connectionId == -1) {
    setStatus('Could not open');
    return;
  }
  setStatus('Connected');

  setPosition(0);
  onRead({bytesRead: 0});
};

function setStatus(status) {
  document.getElementById('status').innerText = status;
}

onload = function() {
  var tv = document.getElementById('tv');
  navigator.webkitGetUserMedia(
      {video: true},
      function(stream) {
        tv.classList.add('working');
        document.getElementById('camera-output').src =
            webkitURL.createObjectURL(stream);
      },
      function() {
        tv.classList.add('broken');
      });

  document.getElementById('position-input').onchange = function() {
    setPosition(parseInt(this.value, 10));
  };

  chrome.experimental.serial.getPorts(function(ports) {
    var eligiblePorts = ports.filter(function(port) {
      return !port.match(/[Bb]luetooth/);
    });

    var portPicker = document.getElementById('port-picker');
    eligiblePorts.forEach(function(port) {
      var portOption = document.createElement('option');
      portOption.value = portOption.innerText = port;
      portPicker.appendChild(portOption);
    });

    portPicker.onchange = function() {
      if (connectionId != -1) {
        chrome.experimental.serial.close(connectionId, openSelectedPort);
        return;
      }
      openSelectedPort();
    };

    function openSelectedPort() {
      var selectedPort = portPicker.options[portPicker.selectedIndex].value;
      chrome.experimental.serial.open(selectedPort, onOpen);
    }

    openSelectedPort();
  });
};
