/**
 * Code from http://www.html5rocks.com/en/tutorials/doodles/gamepad/
 * with tester switched out for DRONE.Gamepad
 */
var gamepadSupport = {
    TYPICAL_BUTTON_COUNT: 16,
    TYPICAL_AXIS_COUNT: 4,
    BUTTON_THROTTLE_MILLISECOND: 100,
    buttonPressedTime: 0,
    ticking: false,
    gamepads: [],
    prevRawGamepadTypes: [],
    prevTimestamps: [],
    init: function () {
        var gamepadSupportAvailable = navigator.getGamepads ||
            !!navigator.webkitGetGamepads ||
            !!navigator.webkitGamepads;
        if (!gamepadSupportAvailable) {
            DRONE.Gamepad.showNotSupported();
        } else {
            // Check and see if gamepadconnected/gamepaddisconnected is supported.
            // If so, listen for those events and don't start polling until a gamepad
            // has been connected.
            if ('ongamepadconnected' in window) {
              window.addEventListener('gamepadconnected',
                                    gamepadSupport.onGamepadConnect, false);
              window.addEventListener('gamepaddisconnected',
                                      gamepadSupport.onGamepadDisconnect, false);
            } else {
              // If connection events are not supported just start polling
              gamepadSupport.startPolling();
            }
        }
    },
    onGamepadConnect: function (event) {
        gamepadSupport.gamepads.push(event.gamepad);
        DRONE.Gamepad.updateGamepads(gamepadSupport.gamepads);
        gamepadSupport.startPolling();
    },
    onGamepadDisconnect: function (event) {
        for (var i in gamepadSupport.gamepads) {
            if (gamepadSupport.gamepads[i].index == event.gamepad.index) {
                gamepadSupport.gamepads.splice(i, 1);
                break;
            }
        }
        if (gamepadSupport.gamepads.length === 0) {
            gamepadSupport.stopPolling();
        }
        DRONE.Gamepad.updateGamepads(gamepadSupport.gamepads);
    },
    startPolling: function () {
        if (!gamepadSupport.ticking) {
            gamepadSupport.ticking = true;
            gamepadSupport.tick();
        }
    },
    stopPolling: function () {
        gamepadSupport.ticking = false;
    },
    tick: function () {
        gamepadSupport.pollStatus();
        gamepadSupport.scheduleNextTick();
    },
    scheduleNextTick: function () {
        if (gamepadSupport.ticking) {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(gamepadSupport.tick);
            } else if (window.mozRequestAnimationFrame) {
                window.mozRequestAnimationFrame(gamepadSupport.tick);
            } else if (window.webkitRequestAnimationFrame) {
                window.webkitRequestAnimationFrame(gamepadSupport.tick);
            }
        }
    },
    pollStatus: function () {
        gamepadSupport.pollGamepads();
        for (var i in gamepadSupport.gamepads) {
            var gamepad = gamepadSupport.gamepads[i];
            if (gamepad.timestamp &&
                (gamepad.timestamp == gamepadSupport.prevTimestamps[i])) {
              continue;
            }
            gamepadSupport.prevTimestamps[i] = gamepad.timestamp;
            gamepadSupport.updateDisplay(i);
        }
    },
    pollGamepads: function () {
        var rawGamepads =
            (navigator.getGamepads && navigator.getGamepads()) ||
            (navigator.webkitGetGamepads && navigator.webkitGetGamepads());
        if (rawGamepads) {
            gamepadSupport.gamepads = [];
            var gamepadsChanged = false;
            for (var i = 0; i < rawGamepads.length; i++) {
                if (typeof rawGamepads[i] != gamepadSupport.prevRawGamepadTypes[i]) {
                    gamepadsChanged = true;
                    gamepadSupport.prevRawGamepadTypes[i] = typeof rawGamepads[i];
                }
                if (rawGamepads[i]) {
                    gamepadSupport.gamepads.push(rawGamepads[i]);
                }
            }

            DRONE.Gamepad.updateGamepads(gamepadSupport.gamepads);

        }
    },
    updateDisplay: function (gamepadId) {
        var gamepad = gamepadSupport.gamepads[gamepadId];
        DRONE.Gamepad.updateAxis(gamepad.axes[0], gamepadId, 'stick-1-axis-x', 'stick-1', true);
        DRONE.Gamepad.updateAxis(gamepad.axes[1], gamepadId, 'stick-1-axis-y', 'stick-1', false);
        DRONE.Gamepad.updateAxis(gamepad.axes[2], gamepadId, 'stick-2-axis-x', 'stick-2', true);
        DRONE.Gamepad.updateAxis(gamepad.axes[3], gamepadId, 'stick-2-axis-y', 'stick-2', false);

        if (Date.now() - gamepadSupport.buttonPressedTime < gamepadSupport.BUTTON_THROTTLE_MILLISECOND) {
          return;
        }
        gamepadSupport.buttonPressedTime = Date.now();
        DRONE.Gamepad.updateButton(gamepad.buttons[0], gamepadId, 'button-1');
        DRONE.Gamepad.updateButton(gamepad.buttons[1], gamepadId, 'button-2');
        DRONE.Gamepad.updateButton(gamepad.buttons[2], gamepadId, 'button-3');
        DRONE.Gamepad.updateButton(gamepad.buttons[3], gamepadId, 'button-4');
        DRONE.Gamepad.updateButton(gamepad.buttons[4], gamepadId, 'button-left-shoulder-top');
        DRONE.Gamepad.updateButton(gamepad.buttons[6], gamepadId, 'button-left-shoulder-bottom');
        DRONE.Gamepad.updateButton(gamepad.buttons[5], gamepadId, 'button-right-shoulder-top');
        DRONE.Gamepad.updateButton(gamepad.buttons[7], gamepadId, 'button-right-shoulder-bottom');
        DRONE.Gamepad.updateButton(gamepad.buttons[8], gamepadId, 'button-select');
        DRONE.Gamepad.updateButton(gamepad.buttons[9], gamepadId, 'button-start');
        DRONE.Gamepad.updateButton(gamepad.buttons[10], gamepadId, 'stick-1');
        DRONE.Gamepad.updateButton(gamepad.buttons[11], gamepadId, 'stick-2');
        DRONE.Gamepad.updateButton(gamepad.buttons[12], gamepadId, 'button-dpad-top');
        DRONE.Gamepad.updateButton(gamepad.buttons[13], gamepadId, 'button-dpad-bottom');
        DRONE.Gamepad.updateButton(gamepad.buttons[14], gamepadId, 'button-dpad-left');
        DRONE.Gamepad.updateButton(gamepad.buttons[15], gamepadId, 'button-dpad-right');

        var extraButtonId = gamepadSupport.TYPICAL_BUTTON_COUNT;
        while (typeof gamepad.buttons[extraButtonId] != 'undefined') {
            DRONE.Gamepad.updateButton(gamepad.buttons[extraButtonId], gamepadId, 'extra-button-' + extraButtonId);
            extraButtonId++;
        }
        var extraAxisId = gamepadSupport.TYPICAL_AXIS_COUNT;
        while (typeof gamepad.axes[extraAxisId] != 'undefined') {
            DRONE.Gamepad.updateAxis(gamepad.axes[extraAxisId], gamepadId, 'extra-axis-' + extraAxisId);
            extraAxisId++;
        }
    }
};
