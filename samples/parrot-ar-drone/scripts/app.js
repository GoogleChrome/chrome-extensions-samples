var logEl = document.getElementById('log');
var commandLog = document.getElementById('commands');
var message = document.getElementById('message');

function clearLog() {
  logEl.textContent = "";
}

function log(msg) {
  logEl.textContent = msg;
//  logEl.scrollTop = 10000000;
}

function onDroneConnected() {
  message.style.display = "none";
  instructions.style.display = "block";
  state.style.display = "block";
}

function onDroneConnectionFailed() {
  log("Connectioned failed - Are you attached to the Drone's Wifi network?");
}

DRONE.Gamepad.onConnected = function() {
  commandLog.style.display = "block";
  DRONE.API.init(onDroneConnected, onDroneConnectionFailed);
};

// start the gamepad
gamepadSupport.init();
