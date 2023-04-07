var connectionId = -1;
var e_dtr, e_rts, e_dcd, e_cts, e_ri, e_dsr;
var dtr, rts;

function onSetControlSignals(result) {
  console.log("onSetControlSignals: " + result);
};

function changeSignals() {
  chrome.serial.setControlSignals(connectionId,
                                  { dtr: dtr, rts: rts },
                                  onSetControlSignals);
}

function onGetControlSignals(signals) {
  e_dcd.innerText = signals.dcd;
  e_cts.innerText = signals.cts;
  e_ri.innerText = signals.ri;
  e_dsr.innerText = signals.dsr;
}

function readSignals() {
  chrome.serial.getControlSignals(connectionId,
                                  onGetControlSignals);
}

function onConnect(connectionInfo) {
  if (!connectionInfo) {
    setStatus('Could not open');
    return;
  }
  connectionId = connectionInfo.connectionId;
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
    return !port.path.match(/[Bb]luetooth/);
  });

  var portPicker = document.getElementById('port-picker');
  eligiblePorts.forEach(function(port) {
    var portOption = document.createElement('option');
    portOption.value = portOption.innerText = port.path;
    portPicker.appendChild(portOption);
  });

  portPicker.onchange = function() {
    if (connectionId != -1) {
      chrome.serial.disconnect(connectionId, openSelectedPort);
      return;
    }
    openSelectedPort();
  };
}

function openSelectedPort() {
  var portPicker = document.getElementById('port-picker');
  var selectedPort = portPicker.options[portPicker.selectedIndex].value;
  chrome.serial.connect(selectedPort, onConnect);
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
  e_ri = document.getElementById('ri_status');
  e_dsr = document.getElementById('dsr_status');

  chrome.serial.getDevices(function(devices) {
    buildPortPicker(devices)
    openSelectedPort();
  });
};

