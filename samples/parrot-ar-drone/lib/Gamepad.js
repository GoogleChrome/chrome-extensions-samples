var DRONE = DRONE || {};
DRONE.Gamepad = (function() {
  var AXIS_THRESHOLD = 0.1;
  var ANALOGUE_BUTTON_THRESHOLD = 0.5;

  function showNotSupported() {
    // TODO Show a connection message
    log("Press a button to connect the gamepad");
  }

  function updateGamepads() {
    // Not implemented
  }

  function updateButton(button, gamepadId, label) {
    var value, pressed;
    if (typeof(button) == 'object') {
      value = button.value;
      pressed = button.pressed;
    } else {
      value = button;
      pressed = button > tester.ANALOGUE_BUTTON_THRESHOLD;
    }

    if(pressed == true) {
      switch(label) {
        case 'button-left-shoulder-top':
          DRONE.API.emergency();
          break;
        case 'button-select':
          DRONE.API.shutdown();
          break;
        case 'button-1':
          if(!!this.onConnected) {
            this.onConnected();
          }
          break;
        case 'button-2':
          DRONE.API.takeOffOrLand();
          break;
        case 'button-3':
          DRONE.API.sendFlatTrim();
          break;
        case 'button-4':
          DRONE.API.flipAnimation();
          break;
      }
    }
  }

  function updateAxis(value, gamepadId, label, stick, xAxis) {
    value = (Math.floor(value * 100) / 100);

    if(Math.abs(value) < AXIS_THRESHOLD) {
      value = 0;
    }

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
          DRONE.API.raiseLower(value);
        }
        break;
    }

  }

  return {
    onConnected: function() { console.log("Override DRONE.Gamepad.onConnected"); },
    showNotSupported: showNotSupported,
    updateGamepads: updateGamepads,
    updateButton: updateButton,
    updateAxis: updateAxis
  };

})();
