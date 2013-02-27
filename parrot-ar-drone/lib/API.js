/**
 * API which opens the sockets and handles sending the data to
 * and receiving the data from the AR Drone
 *
 * Additional thanks to Felix Geisendörfer (felixge) for the Node AR Drone lib
 * which served as a helpful reference.
 *
 * @see https://github.com/felixge/node-ar-drone
 */
var DRONE = DRONE || {};
DRONE.API = (function() {

  var SIMULATE = false;

  // Constants
  var TO_DRONE = 0;
  var TO_CLIENT = 1;
  var DRONE_IP = "192.168.1.1";
  var CLIENT_IP = "192.168.1.2";
  var CONNECTIONS = 3;
  var ONE_BUFFER = DRONE.Util.uint8ToArrayBuffer(1);
  var TAKEOFF = 290718208; // 512
  var LAND = 290717696; // 0
  var COMMANDS_ENABLED = 1;

  // Vars
  var send = false;
  var noop = function() {};
  var keepAliveTimeout = 0;
  var connectionsOutstanding = CONNECTIONS;
  var sockets = {
    "nav": {
      protocol: "udp",
      port: 5554,
      socket: null,
      type: 'bind',
      direction: TO_CLIENT
    },
    "vid": {
      protocol: "tcp",
      port: 5555,
      socket: null,
      type: 'connect',
      direction: TO_DRONE
    },
    "at": {
      protocol: "udp",
      port: 5556,
      socket: null,
      type: 'bind',
      direction: TO_CLIENT
    },
    "cmd": {
      protocol: "udp",
      port: 5559,
      socket: null,
      type: 'connect',
      direction: TO_DRONE
    }
  };
  var status = {
    verticalSpeed: 0,
    angularSpeed: 0,
    leftRightTilt: 0,
    frontBackTilt: 0,
    enabled: 0,
    mode: LAND
  };

  callbacks = {

    /**
     * Called whenever one of our sockets has connected
     */
    onConnected: function(connectionResult) {

      // if we have 0 or higher we're good
      if(connectionResult >= 0) {

        connectionsOutstanding--;

        // if we're all done with our connecting
        if(connectionsOutstanding === 0 && callbacks.onAllConnected) {

          // start sending commands
          sendKeepAliveCommand();
          sendFlatTrim();
          sendSensitivity();

          // set this to true if you're flying outdoors
          sendOutdoor(false);

          // now enable controls
          status.enabled = COMMANDS_ENABLED;

          // go go go!
          takeOffOrLand();

          if(callbacks.onAllConnected) {
            callbacks.onAllConnected();
          }
        }

      } else {
        // Flag that there was an issue
        if(callbacks.onConnectionError) {
          callbacks.onConnectionError();
        }
      }
    },

    /* Placeholder callbacks */
    onAllConnected: null,
    onConnectionError: null
  };

  // -- Bootstrap

  function bootstrapClientIp() {
    // double check the Client IP (sometimes the Drone assignes 192.168.1.3)
    chrome.socket.getNetworkList(function(entries) {
      if (entries) for (var i=0; i<entries.length; i++) {
        if (entries[i] && entries[i].address 
          && entries[i].address.indexOf("192.168.1.")==0) {
          if (CLIENT_IP != entries[i].address) {
            CLIENT_IP = entries[i].address;
            log("Client IP changed to "+CLIENT_IP);
          }
          return;
        }
      }
    });

  }
  /**
   * Initialises the connections to the Drone
   */
  function init(cbConnected, cbConnectionError) {

    bootstrapClientIp();

    // assign the callbacks
    callbacks.onAllConnected = cbConnected;
    callbacks.onConnectionError = cbConnectionError;

    // send the drone AT commands
    connect(sockets['at']);

    // get navigation data from the drone
    connect(sockets['nav']);

    // get a video stream from the drone
    // TODO: connect(sockets['vid'], 'tcp');

    // send admin commands to the drone
    connect(sockets['cmd']);
  }

  /**
   * Closes and discards all the socket connections
   */
  function shutdown() {
    disconnect(sockets['at'].socket);
    disconnect(sockets['nav'].socket);
    disconnect(sockets['cmd'].socket);
    // TODO: disconnect(sockets['vid'].socket);
  }

  /**
   * Creates and connects a socket connection
   *
   * @see http://developer.chrome.com/apps/socket.html
   */
  function connect(sockRef) {

    // grab the protocol, type, port and IP from
    // the sockRef passed in and use that
    // to create the socket
    if (SIMULATE) {
      callbacks.onConnected(1);
    } else {
      chrome.socket.create(sockRef.protocol, undefined, function(sockInfo) {
        sockRef.socket = sockInfo.socketId;
        chrome.socket[sockRef.type](sockRef.socket,
          sockRef.direction===TO_DRONE?DRONE_IP:CLIENT_IP,
          sockRef.port,
          callbacks.onConnected);
        });
    }
  }

  /**
   * Disconnects and destroys the socket connection
   */
  function disconnect(sockRef) {
    if (!SIMULATE) {
      chrome.socket.disconnect(sockRef);
      chrome.socket.destroy(sockRef);
    }
  }

  // -- Stream functions

  /**
   * Converts an array of commands to a string and then
   * an ArrayBuffer to send over the socket to the drone
   */
  function sendCommands(commands) {

    if (keepAliveTimeout) clearTimeout(keepAliveTimeout);

    var atSock = sockets['at'];
    var commandBuffer = DRONE.Util.stringToArrayBuffer(commands.join(""));

    // output the commands
    log(commands.join("")+"   "+JSON.stringify(status));

    // send all the commands
    if (!SIMULATE) {
      chrome.socket.sendTo(
        atSock.socket,
        commandBuffer,
        DRONE_IP,
        atSock.port,
        noop);
    }

    // set up a keepalive just in case we don't
    // for whatever reason send the other commands
    keepAliveTimeout = setTimeout(sendKeepAliveCommand, 1000);
  }

  /**
   * Helper function we use before letting the drone take off
   * that we use to let it know that it's horizontal
   */
  function sendFlatTrim() {
    sendCommands([new DRONE.Command('FTRIM')]);
  }

  /**
   * Helper function that tells the drone what sensitivity
   * we want. This is quite a high value (min = 0, max = 0.52)
   */
  function sendSensitivity() {
    sendCommands([
      new DRONE.Command('CONFIG', ['"control:euler_angle_max"', '"0.11"']),
      new DRONE.Command('CONFIG', ['"control:indoor_euler_angle_max"', '"0.11"']),
      new DRONE.Command('CONFIG', ['"control:outdoor_euler_angle_max"', '"0.11"'])
    ]);
  }

  /**
   * Informs the drone that it is going to be flying outdoors
   */
  function sendOutdoor(outdoor) {
    sendCommands([new DRONE.Command('CONFIG', ['"control:outdoor"', '"'+(outdoor?'TRUE':'FALSE')+'"'])]);
  }

  /**
   * Sends a keepalive command and attempts to read
   * back the latest data from the drone
   */
  function sendKeepAliveCommand() {
    var navSock = sockets['nav'];
    if (!SIMULATE) {
      chrome.socket.sendTo(
        navSock.socket,
        (new Uint8Array([1])).buffer,
        DRONE_IP,
        navSock.port,
        noop);

      chrome.socket.read(
        navSock.socket,
        function(data) {

          // if we have data parse it
          // otherwise shutdown and call it a day
          if(data.data.byteLength > 0) {
            DRONE.NavData.parse(data.data);
          } else {
        //    shutdown();
          }
        });
    }

    // ensure we call this again
    // restore later: setTimeout(sendKeepAliveCommand, 200);

  }

  var takeoffLandStart;
  var previousTakeoffStatus;

  /**
   * The takeoff loop. This should keep sending the REF command until the 
   * navdata shows that it has taken off, but since we don't yet interpret navdata,
   * let's just keep it doing this for four seconds.
   */
  function takeOffOrLand() {

    if (!takeoffLandStart || previousTakeoffStatus!=status.mode) {
      takeoffLandStart = Date.now();
      previousTakeoffStatus=status.mode;
    } else {
      // five seconds
      if (takeoffLandStart+5000<Date.now()) {
        takeoffLandStart=0;
        loop();
        return;
      }
    }

    commands = [
      // Take off
      new DRONE.Command('REF', [
        status.mode
      ])

    ];

    // send and reschedule
    sendCommands(commands);
    setTimeout(takeOffOrLand, 60);
  }

  /**
   * The main loop. This sends the commands to the drone, including
   * the tilt, speed and whether or not we want it to take off or land
   */
  function loop() {

    if (previousTakeoffStatus!=status.mode) {
      takeOffOrLand();
      return;
    }

    commands = [

      // Take off
      new DRONE.Command('REF', [
        status.mode
      ]),

      new DRONE.Command('PCMD', [

        // Enables/Disables commands
        status.enabled,

        // Left - Right tilt
        DRONE.Util.float32ToInt32(status.leftRightTilt),

        // Front - Back tilt
        DRONE.Util.float32ToInt32(status.frontBackTilt),

        // Vertical Speed
        DRONE.Util.float32ToInt32(status.verticalSpeed),

        // Angular Speed
        DRONE.Util.float32ToInt32(status.angularSpeed)

      ])
   ];

    // send and schedule the update
    sendCommands(commands);

    setTimeout(loop, 60);
  }

  // -- Actions

  function takeOff() {
    status.mode = TAKEOFF;
  }

  function land() {
    status.mode = LAND;
  }

  function raiseLower(val) {
    val = check(val, 0);
    status.verticalSpeed = val;
  }

  function tiltLeftRight(val) {
    val = check(val, 0);
    status.leftRightTilt = val;
  }

  function tiltFrontBack(val) {
    val = check(val, 0);
    status.frontBackTilt = val;
  }

  function rotateLeftRight(val) {
    val = check(val, 0);
    status.angularSpeed = -val;
  }

  /**
   * Resets all values to zero
   */
  function allStop() {
    status.angularSpeed = 0;
    status.verticalSpeed = 0;
    status.frontBackTilt = 0;
    status.leftRightTilt = 0;
  }

  function check(val, defaultVal) {
    if(typeof val === "undefined") {
      val = defaultVal;
    }
    return val;
  }

  return {
    init: init,
    takeOff: takeOff,
    land: land,
    raiseLower: raiseLower,
    tiltLeftRight: tiltLeftRight,
    tiltFrontBack: tiltFrontBack,
    rotateLeftRight: rotateLeftRight,
    allStop: allStop,
    shutdown: shutdown
  };

})();
