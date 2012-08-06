var connectionId = -1;
var e_dtr, e_rts, e_dcd, e_cts;
var dtr, rts;

function onSetControlSignals(result) {
  console.log("onSetControlSignals: " + result);
};

function changeSignals() {
  chrome.serial.setControlSignals(connectionId,
                                               { dtr: dtr, rts: rts },
                                               onSetControlSignals);
}

function onGetControlSignals(options) {
  e_dcd.innerText = !!options.dcd;
  e_cts.innerText = !!options.cts;
}

function readSignals() {
  chrome.serial.getControlSignals(connectionId,
                                               onGetControlSignals);
}

function onOpen(openInfo) {
  connectionId = openInfo.connectionId;
  if (connectionId == -1) {
    setStatus('Could not open');
    return;
  }
  setStatus('Connected');

  dtr = false;
  rts = false;
  changeSignals();

  setInterval(readSignals, 1000);
};

function setStatus(status) {
  document.getElementById('status').innerText = status;
}

function buildPortPicker(ports) {
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
      chrome.serial.close(connectionId, openSelectedPort);
      return;
    }
    openSelectedPort();
  };
}

function openSelectedPort() {
  var portPicker = document.getElementById('port-picker');
  var selectedPort = portPicker.options[portPicker.selectedIndex].value;
  chrome.serial.open(selectedPort, onOpen);
}

onload = function() {
  e_dtr = document.getElementById('dtr_input');
  e_rts = document.getElementById('rts_input');
  e_dtr.onchange = function() {
    dtr = e_dtr.checked;
    changeSignals();
  }
  e_rts.onchange = function() {
    rts = e_rts.checked;
    changeSignals();
  }

  e_dcd = document.getElementById('dcd_status');
  e_cts = document.getElementById('cts_status');

  chrome.serial.getPorts(function(ports) {
    buildPortPicker(ports)
    openSelectedPort();
  });
};
