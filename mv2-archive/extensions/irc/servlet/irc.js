/*
 * IRCConnection is a simple implementation of the IRC protocol. A small
 * subset of the IRC commands are implemented. To be functional, IRCConnection
 * needs some mechanism of transport to be hooked up by:
 * -Passing in |sendFunc| and |closeFunc| which an IRCConnection to use to send
 *  an IRC message command and to close the connection respectively.
 * -Connecting the in-bound functions |onOpened|, |onMessage|, and |onClosed|,
 *  to the transport so that the IRCConnection can respond to the connection
 *  being opened, a message being received and the connection being closed.
 */

function NoOp() {};
function log(message) { console.log(message); };

function IRCConnection(server, port, nick, sendFunc, closeFunc) {
  this.server = server;
  this.port = port;
  this.nick = nick;
  this.connected = false;
  
  var that = this;

  /**
   * Client API
   */
  this.onConnect = NoOp;
  this.onDisconnect = NoOp;
  this.onText = NoOp;
  this.onNotice = NoOp;
  this.onNickReferenced = NoOp;

  this.joinChannel = function(channel) {
    sendCommand(commands.JOIN, [channel], "");
  };

  this.sendMessage = function(recipient, message) {
    sendCommand(commands.PRIVMSG, [recipient], message);
  };

  this.quitChannel = function(channel) {
    sendCommand(commands.PART, [channel], "");
  }

  this.disconnect = function(message) {
    sendCommand(commands.QUIT, [], message);
    closeFunc();
  }

  /**
   * Transport Interface
   * Whatever transport is used must provide and connect to the following
   * in-bound events.
   */
  this.onOpened = function() {
    sendFunc(that.server + ":" + that.port);
    sendCommand(commands.NICK, [this.nick], "");
    sendCommand(commands.USER,
                ["chromium-irc-lib", "chromium-ircproxy", "*"],
                "indigo");
  };

  this.onMessage = function(message) {
    log("<< " + message);
    if (!message || !message.length) {
      return;
    }

    var parsed = parseMessage(message);

    // Respond to PING command.
    if (parsed.command == commands.PING) {
      sendCommand(commands.PONG, [], parsed.body);
      return;
    }

    // Process PRIVMSG.
    if (parsed.command == commands.PRIVMSG) {
      if (parsed.body.charCodeAt(0) == 1) {
        // Ignore CTCP.
        return;
      }
      that.onText(parsed.parameters[0],
                  parsed.prefix.split("!")[0],
                  parsed.body);
      return;
    }

    // TODO: Other IRC commands.
    var commandCode = parseInt(parsed.command);
    if (commandCode == NaN) {
      return;
    }

    switch(commandCode) {
      case 001:  // Server welcome message.
        that.connected = true;
        that.onConnect(parsed.body);
        break;
      case 002:
      case 003:
      case 004:
      case 005:
        if (!that.connected) {
          that.connected = true;
          that.onConnect();
        }
        break;
      case 433:  // TODO(rafaelw): Nickname in use. 
        throw "NOT IMPLEMENTED";
        break;
      default:
        break;
    }
  }

  this.onClosed = function() {
    that.connected = false;
    that.onDisconnect();
  };

  /**
   * IRC Implementation
   * What follows in a minimal implementation of the IRC protocol.
   * Only |commands| are currently implemented.
   */
  var commands = {
    JOIN: "JOIN",
    NICK: "NICK",
    NOTICE: "NOTICE",
    PART: "PART",
    PING: "PING",
    PONG: "PONG",
    PRIVMSG: "PRIVMSG",
    QUIT: "QUIT",
    USER: "USER"
  };

  function parseMessage(message) {
    var parsed = {};
    parsed.prefix = "";
    parsed.command = "";
    parsed.parameters = [];
    parsed.body = "";

    // Trim trailing CRLF.
    var crlfIndex = message.indexOf("\r\n");
    if(crlfIndex >= 0) {
      message = message.substring(0, crlfIndex);
    }

    // If leading character is ':', the message starts with a prefix.
    if (message.indexOf(':') == 0) {
      parsed.prefix = message.substring(1, message.indexOf(" "));
      message = message.substring(parsed.prefix.length + 2);

      // Forward past extra whitespace.
      while(message.indexOf(" ") == 0) {
        message = message.substring(1);
      }
    }

    // If there is still a ':', then the message has trailing body.
    var bodyMarker = message.indexOf(':');
    if (bodyMarker >= 0) {
      parsed.body = message.substring(bodyMarker + 1);
      message = message.substring(0, bodyMarker);
    }

    parsed.parameters = message.split(" ");
    parsed.command = parsed.parameters.shift();  // First param is the command.

    return parsed;
  }

  function sendCommand(command, params, message) {
    var line = command;
    if (params && params.length > 0) {
      line += " " + params.join(" ");
    }
    if (message && message.length > 0) {
      line += " :"  + message;
    }

    log(">> " + line);
    line += "\r\n";
    sendFunc(line);
  };
};
