var DRONE = DRONE || {};
DRONE.Command = function(command, parts) {
  this.command = command;
  this.parts = parts || [];
};

DRONE.Command.prototype.create = function(command, parts) {
  return new DRONE.Command(command, parts);
};

DRONE.Command.prototype.toString = function() {
  return "AT*" + this.command + "=" +
    DRONE.Sequence.next() + (this.parts.length ? "," : "") +
    this.parts.join(",") + "\r";
};
