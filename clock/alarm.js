Alarm = function(id, name, hour, minute, on) {
	this.id = id;
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