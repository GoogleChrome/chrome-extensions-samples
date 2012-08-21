Timer = function() {
	this.config = {
		container: {height: 250, width: 250},
		face: {color: '#424240', alpha: 1, radius: 120},
		hourHand: {color: '#4d90fe', alpha: 1, length: 35, width: 3},
		minuteHand: {color: '#4d90fe', alpha: 1, length: 90, width: 2},
		unit: {
			major: {color: '#f5f5f5', alpha: 0.4, length: 12, width: 2},
			mid: {color: '#f5f5f5', alpha: 0.4, length: 12, width: 1},
			minor: {color: '#f5f5f5', alpha: 0.4, length: 8, width: 1}
		},
	};
	this.countdown = new Date(0);
	this.timing = false;
	this.minutes = 0;
	this.seconds = 0;

}

//Timer inherits from Clock
Timer.prototype = new Clock(this.id, 0);

//Method to initialize the Timer
Timer.prototype.create = function() {
	this.canvas = $('.timer .clock')[0];
	this.canvas.height = this.config.container.height;
	this.canvas.width = this.config.container.width;

	this.context = this.canvas.getContext("2d");

	this.drawClock(0, 0, 0, 0);

	this.startTick();
}

//Methods to draw the timer
Timer.prototype.drawClock = function (hour, minute, second, millisecond) {
	this.context.clearRect(0, 0, this.config.container.width, this.config.container.height);

	this.drawface();
	this.drawUnits();
	this.innerShadow();
	this.drawText(hour, minute, second);
	this.drawTime(minute, second, millisecond);
	this.drawHands(hour, minute, second, millisecond);
}

//Method to draw the hands
Timer.prototype.drawHands = function(hour, minute, second, millisecond) {
	this.context.save();

	this.context.translate(this.config.container.width/2,this.config.container.height/2);
	this.context.rotate(Math.PI * (2.0 * ((minute + (second/60.0))/60) - 0.5));
	this.context.globalAlpha = this.config.minuteHand.alpha;
	this.context.strokeStyle = this.config.minuteHand.color;
	this.context.lineWidth = this.config.minuteHand.width;
	this.context.lineCap = "round";
	this.context.shadowOffsetX = 0;
	this.context.shadowOffsetY = 4;
	this.context.shadowBlur = 2;
	this.context.shadowColor = "rgba(0, 0, 0, 0.2)";

	this.context.beginPath();
	this.context.moveTo(0, 0);
	this.context.lineTo(this.config.minuteHand.length - 5, 0);
	this.context.closePath();

	this.context.stroke();

	this.context.restore();

	this.context.save();
	this.context.beginPath();
	this.context.arc(this.config.container.width/2, this.config.container.height/2, 4, 0, Math.PI*2, false);
	this.context.closePath();
	this.context.fillStyle = this.config.minuteHand.color;
	this.context.fill();
	this.context.restore();

	this.context.save();
	this.context.beginPath();
	this.context.arc(this.config.container.width/2, this.config.container.height/2, 1, 0, Math.PI*2, false);
	this.context.closePath();
	this.context.fillStyle = this.config.unit.major.color;
	this.context.fill();
	this.context.restore();
}

//Method to draw the number
Timer.prototype.drawText = function(hour, minute, second, millisecond) {
	//Numbers for main face
	for (var i = 0; i < 12; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/2);
		this.context.rotate(Math.PI * (2.0 * (i/12) - 0.5));
		this.context.translate(this.config.face.radius - 22, 0);
		this.context.rotate((Math.PI * (2.0 * (i/12) - 0.5) * -1));

		var alpha = this.config.unit.major.alpha;

		this.context.globalAlpha = alpha;

		this.context.fillStyle = this.config.unit.major.color;
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
		this.context.shadowColor = "rgba(0, 0, 0, 0.8)";
		this.context.font = "600 11px 'Open Sans'";
		this.context.textBaseline = 'middle';
		this.context.textAlign = "center";

		var textValue;

		if (i === 0) {
			textValue = 60;
		}
		else {
			textValue = i * 5;
		}

		this.context.fillText(textValue, 0, 0);
		this.context.restore();
	}
}

//Method to draw the units
Timer.prototype.drawUnits = function() {
	//Draw units for main face
	for (var i = 0; i < 60; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/2);
		this.context.rotate(Math.PI * (2.0 * (i/60) - 0.5));
		this.context.globalAlpha = this.config.unit.major.alpha;
		this.context.strokeStyle = this.config.unit.major.color;

		if (i % 5 === 0) {
			this.context.lineWidth = this.config.unit.major.width;
			var length = this.config.unit.major.length;
		}
		else {
			this.context.lineWidth = this.config.unit.minor.width;
			var length = this.config.unit.minor.length;
		}

		this.context.beginPath();
		this.context.moveTo(this.config.face.radius - length, 0);
		this.context.lineTo(this.config.face.radius, 0);
		this.context.closePath();
		this.context.stroke();
		this.context.restore();
	}
}

Timer.prototype.drawTime = function(minute, second, millisecond) {
	this.context.save();

	this.context.translate(this.config.container.width/2, this.config.container.height/1.3);

	var alpha = this.config.unit.major.alpha;

	this.context.globalAlpha = alpha;

	this.context.fillStyle = this.config.unit.major.color;
	this.context.shadowOffsetX = 1;
	this.context.shadowOffsetY = 1;
	this.context.shadowColor = "rgba(0, 0, 0, 0.8)";
	this.context.font = "600 14px 'Open Sans'";
	this.context.textBaseline = 'middle';
	this.context.textAlign = "center";

	if (minute < 10) minute = '0' + minute;
	if (second < 10) second = '0' + second;

	var textValue = minute + ':' + second;

	this.context.fillText(textValue, 0, 0);
	this.context.restore();
}

Timer.prototype.startTiming = function() {
	this.timing = true;
}

Timer.prototype.stopTiming = function() {
	this.timing = false;
}

Timer.prototype.resetWatch = function() {
	this.timing = false;
	this.countdown = new Date(0)
	this.drawClock(0, 0, 0, 0);
}

Timer.prototype.setWatch = function(minute, second) {
	this.minute = minute;
	this.second = second;
	this.countdown = new Date(0, 0, 0, 0, this.minute, this.second);
	this.drawClock(0, this.minute, this.second, 0);
}

//Method to fire ten times each second and redraw the clock
Timer.prototype.tick = function() {
	if (this.timing) {
		var minute = this.countdown.getMinutes();
		var second = this.countdown.getSeconds();
		var millisecond = this.countdown.getMilliseconds();
		this.drawClock(0, minute, second, millisecond);
		if (minute == 0 && second == 0) {
			this.timing = false;
			$('.timer .button.stop').addClass('disabled');
			var notification = webkitNotifications.createNotification(
					'img/timer.png', 'World Clock Timer', '');
			notification.show();
		} else {
			this.countdown.setTime(this.countdown.getTime() - 100);
		}
	}
}

Timer.prototype.startTick = function() {
	var inst = this;
	this.tickId = setInterval(function() { inst.tick(); }, 100);
}
