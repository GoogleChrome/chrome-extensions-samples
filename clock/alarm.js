Alarm = function(id, name, hour, minute, on) {
	this.id = id;
	this.name = name;
	this.hour = hour;
	this.minute = minute;
	this.on = on;
	this.displayed = false;

	this.notification = webkitNotifications.createNotification(
			'img/alarm.png', name, '');

	this.alarm_time = new Date();
	this.alarm_time.setHours(hour);
	this.alarm_time.setMinutes(minute);
}

//Alarm inherits from Clock
Alarm.prototype = new Clock(this.id, 0);

//Method to initialize the alarm
Alarm.prototype.create = function() {
	this.canvas = $('.alarm .' + this.id + ' .clock')[0];
	this.canvas.height = this.config.container.height;
	this.canvas.width = this.config.container.width;

	this.context = this.canvas.getContext("2d");

	this.startTick();
}

//Method to update the alarm
Alarm.prototype.update = function(name, hour, minute) {
	this.name = name;
	this.hour = hour;
	this.minute = minute;
	this.drawClock(this.hour, this.minute, 0);
 	this.displayTime(this.hour, this.minute, false);
}

//Method to draw the number
Alarm.prototype.drawText = function(hour, minute, second) {
	for (var i = 0; i < 12; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/2);
		this.context.rotate(Math.PI * (2.0 * (i/12) - 0.5));
		this.context.translate(this.config.face.radius - 24, 0);
		this.context.rotate((Math.PI * (2.0 * (i/12) - 0.5) * -1));

		var alpha = this.config.unit.major.alpha;

		if (i === 0)
			var textValue = 12;
		else
			var textValue = i;

		this.context.globalAlpha = alpha;

		this.context.fillStyle = this.config.unit.major.color;
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
		this.context.shadowColor = "rgba(0, 0, 0, 0.8)";
		this.context.font = "500 13px 'Open Sans'";
		this.context.textBaseline = 'middle';
		this.context.textAlign = "center";

		this.context.fillText(textValue, 0, 0);
		this.context.restore();
	}
}

//Method to fire each second and redraw the clock
Alarm.prototype.tick = function() {
 	this.drawClock(this.hour, this.minute, 0);
 	this.displayTime(this.hour, this.minute, false);
 	var now = new Date();
 	if (this.on && now.getHours() == this.hour && now.getMinutes() == this.minute && !this.displayed) {
 		this.displayed = true;
 		this.notification.show();
 	} else {
 		this.displayed = false;
 	}
}

Alarm.prototype.toggleState = function() {
	this.on = !this.on;
	return this.on;
}