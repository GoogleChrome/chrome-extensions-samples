function ChatClient(config) {
  this.name = config.name || "Anonymous";
  this.knownUsers = {};
  this.knownUsersCount = 0;
  MulticastSocket.call(this, config);
}
function emptyFn() {
}
var invalidCharRe = /[^\w \(\)'"\.,\\\/\?]/g;
var proto = ChatClient.prototype =
  Object.create(MulticastSocket.prototype);
proto.connected = false;

proto.onError = function (err) {
  this.onInfo(err, "error");
};

proto.onConnected = function () {
  var me = this;
  this.onInfo("Connected as [" + this.name + "]");
  this.connected = true;
};

proto.onDisconnected = function () {
  this.clearUser();
  this.onInfo("Disconnected");
  this.connected = false;
};

proto.onDiagram = function (message, address) {
  message = this.arrayBufferToString(message);
  try {
    var obj = JSON.parse(message);
  } catch (e) {
    return;
  }
  if (!obj) {
    return;
  }
  switch (obj.type) {
    case 'message':
      this.onMessage(obj.message, obj.name, address);
      break;
    case 'hello':
      this.sendDiagram(JSON.stringify({
        type: "ack",
        name: this.name
      }));
      this.addUser(obj.name, address);
      break;
    case 'ack':
      this.addUser(obj.name, address);
      break;
    case 'goodbye':
      this.removeUser(obj.name, address);
      break;
  }
};

proto.addUser = function (name, ip) {
  name = name.replace(invalidCharRe, '');
  if (this.knownUsers.hasOwnProperty(name)) {
    if (this.knownUsers[name].hasOwnProperty(ip)) {
      return;
    }
  } else {
    this.knownUsers[name] = {};
  }
  this.knownUsersCount++;
  this.knownUsers[name][ip] = true;
  this.onAddUser(name, ip);
};

proto.removeUser = function (name, ip) {
  if (this.knownUsers.hasOwnProperty(name)) {
    if (this.knownUsers[name].hasOwnProperty(ip)) {
      this.knownUsersCount--;
      delete this.knownUsers[name][ip];
      this.onRemoveUser(name, ip);
    }
    if (Object.keys(this.knownUsers[name]) == 0) {
      delete this.knownUsers[name];
    }
  }
};

proto.clearUser = function () {
  var users = [];
  for (var name in this.knownUsers) {
    for (var ip in this.knownUsers[name]) {
      users.push(name, ip);
    }
  }
  for (var i = 0; i < users.length; i += 2) {
    this.removeUser(users[i], users[i + 1]);
  }
};

proto.onInfo = function (message, level) {

};

proto.onAddUser = function (name, ip) {

};

proto.onRemoveUser = function (name, ip) {

};

proto.onMessage = function (message, name, ip) {

};

proto.enter = function (callback) {
  if (!this.connected) {
    this.connect(function () {
      this.sendDiagram(JSON.stringify({
        type: 'hello',
        name: this.name
      }), callback);
    });
  } else {
    callback.call(this);
  }
};

proto.exit = function (callback) {
  if (!callback) {
    callback = emptyFn;
  }
  if (this.connected) {
    this.sendDiagram(JSON.stringify({
      type: 'goodbye',
      name: this.name
    }), function () {
      this.disconnect(callback);
    });
  } else {
    callback.call(this);
  }
};

proto.renameTo = function (newName, callback) {
  newName = newName.replace(invalidCharRe, '');
  if (this.name != newName) {
    this.sendDiagram(JSON.stringify({
      type: 'goodbye',
      name: this.name
    }), function () {
      this.name = newName;
      this.sendDiagram(JSON.stringify({
        type: 'hello',
        name: this.name
      }), function () {
        this.onInfo("Renamed to [" + newName + "]", "info");
        callback.call(this, newName);
      });
    });
  } else if (callback) {
    callback.call(this, newName);
  }
};

proto.sendMessage = function (message, callback) {
  var me = this;
  this.sendDiagram(JSON.stringify({
    type: 'message',
    name: this.name,
    message: message
  }), callback, function() {
    me.onError("Error sending message (probably too large). Reconnecting soon.");
    me.disconnect();
    setTimeout(function() {
      me.enter(callback);
    }, 100);
  });
};