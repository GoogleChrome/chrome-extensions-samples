var DRONE = DRONE || {};
DRONE.API = (function() {

  // Constants
  var DRONE_IP = "192.168.1.1";
  var CLIENT_IP = "192.168.1.2";
  var CONNECTIONS = 3;
  var ONE_BUFFER = DRONE.Util.uint8ToArrayBuffer(1);
  var TAKEOFF = 290718208;
  var LAND = 290717696;
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
      ip: CLIENT_IP
    },
    "vid": {
      protocol: "tcp",
      port: 5555,
      socket: null,
      type: 'connect',
      ip: DRONE_IP
    },
    "at": {
      protocol: "udp",
      port: 5556,
      socket: null,
      type: 'bind',
      ip: CLIENT_IP
    },
    "cmd": {
      protocol: "udp",
      port: 5559,
      socket: null,
      type: 'connect',
      ip: DRONE_IP
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

          // send this if you're flying outdoors
          // sendOutdoor();

          // now enable controls
          status.enabled = COMMANDS_ENABLED;

          // go into the main command loop
          loop();

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

  /**
   * Initialises the connections to the Drone
   */
  function init(cbConnected, cbConnectionError) {

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
   */
  function connect(sockRef) {

    // grab the protocol, type, port and IP from
    // the sockRef passed in and use that
    // to create the socket
    chrome.socket.create(sockRef.protocol, undefined, function(sockInfo) {
      sockRef.socket = sockInfo.socketId;
      chrome.socket[sockRef.type](sockRef.socket,
        sockRef.ip,
        sockRef.port,
        callbacks.onConnected);
    });
  }

  /**
   * Disconnects and destroys the socket connection
   */
  function disconnect(sockRef) {
    chrome.socket.disconnect(sockRef);
    chrome.socket.destroy(sockRef);
  }

  // -- Stream functions

  /**
   * Converts an array of commands to a string and then
   * an ArrayBuffer to send over the socket to the drone
   */
  function sendCommands(commands) {

    var atSock = sockets['at'];
    var commandBuffer = DRONE.Util.stringToArrayBuffer(commands.join(""));

    // output the commands
    log(commands.join(""));

    // send all the commands
    chrome.socket.sendTo(
      atSock.socket,
      commandBuffer,
      DRONE_IP,
      atSock.port,
      noop);

    // set up a keepalive just in case we don't
    // for whatever reason send the other commands
    clearTimeout(keepAliveTimeout);
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
      new DRONE.Command('CONFIG', ['"control:euler_angle_max"', '"0.31"']),
      new DRONE.Command('CONFIG', ['"control:indoor_euler_angle_max"', '"0.31"']),
      new DRONE.Command('CONFIG', ['"control:outdoor_euler_angle_max"', '"0.31"'])
    ]);
  }

  /**
   * Informs the drone that it is going to be flying outdoors
   */
  function sendOutdoor() {
    sendCommands([new DRONE.Command('CONFIG', ['"control:outdoor"', '"TRUE"'])]);
  }

  /**
   * Sends a keepalive command and attempts to read
   * back the latest data from the drone
   */
  function sendKeepAliveCommand() {

    var navSock = sockets['nav'];
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
          shutdown();
        }
      });

    // ensure we call this again
    setTimeout(sendKeepAliveCommand, 1000);
  }

  /**
   * The main loop. This sends the commands to the drone, including
   * the tilt, speed and whether or not we want it to take off or land
   */
  function loop() {

    commands = [

      new DRONE.Command('PCMD_MAG', [

        // Enables/Disables commands
        status.enabled,

        // Left - Right tilt
        DRONE.Util.float32ToInt32(status.leftRightTilt),

        // Front - Back tilt
        DRONE.Util.float32ToInt32(status.frontBackTilt),

        // Vertical Speed
        DRONE.Util.float32ToInt32(status.verticalSpeed),

        // Angular Speed
        DRONE.Util.float32ToInt32(status.angularSpeed),

        0,

        0

      ]),

      // Take off / land
      new DRONE.Command('REF', [
        status.mode
      ])
    ];

    // send and schedule the update
    sendCommands(commands);

    setTimeout(loop, 30);
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
