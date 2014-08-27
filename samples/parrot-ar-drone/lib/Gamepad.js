var DRONE = DRONE || {};
DRONE.Gamepad = (function() {

  var updated = false;
  var active = false;

  function showNotSupported() {
    // TODO Show a connection message
    log("Press a button to connect the gamepad");
  }

  function updateGamepads() {
    // Not implemented
  }

  function updateButton(value, gamepadId, label) {

    if(active && value === 1) {
      switch(label) {
        case 'button-right-shoulder-top':
          DRONE.API.takeOff();
          break;

        case 'button-left-shoulder-top':
          DRONE.API.land();
          break;

        case 'button-select':
          DRONE.API.allStop();
          break;
      }
    }

    if(label === 'button-1' && value === 1) {
      if(!!this.onConnected && !updated) {
        updated = true;
        this.onConnected();
      }
    }

  }

  function updateAxis(value, gamepadId, label, stick, xAxis) {

    value = (Math.floor(value * 100) / 100);

    if(Math.abs(value) < 0.02) {
      value = 0;
    }

    if(active) {
      switch(stick) {

        case "stick-1":
          // tilt
          if(xAxis) {
            DRONE.API.tiltLeftRight(value);
          } else {
            DRONE.API.tiltFrontBack(value);
          }
          break;

        case "stick-2":
          // rotate, raise, lower
          value *= -1;

          if(xAxis) {
            DRONE.API.rotateLeftRight(value);
          } else {
            if(Math.abs(value) < 0.1) {
              value = 0;
            }
            DRONE.API.raiseLower(value);
          }
          break;

      }
    }
  }

  return {
    enable: function() { active = true; },
    onConnected: function() { console.log("Override DRONE.Gamepad.onConnected"); },
    showNotSupported: showNotSupported,
    updateGamepads: updateGamepads,
    updateButton: updateButton,
    updateAxis: updateAxis
  };

})();
