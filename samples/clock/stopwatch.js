Stopwatch = function() {
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
		minute: {
			face: {color: '#424240', alpha: 1, radius: 35},
			hand: {color: '#4d90fe', alpha: 1, length: 20, width: 2},
			unit: {
				major: {color: '#f5f5f5', alpha: 0.4, length: 5, width: 2},
				mid: {color: '#f5f5f5', alpha: 0.4, length: 5, width: 1},
				minor: {color: '#f5f5f5', alpha: 0.4, length: 2, width: 1}
			}
		}
	};

	this.timing = false;
	this.time_passed = new Date(0);
}

//Stopwatch inherits from Clock
Stopwatch.prototype = new Clock(this.id, 0);

//Method to initialize the stopwatch
Stopwatch.prototype.create = function() {
	this.canvas = $('.stopwatch .clock')[0];
	this.canvas.height = this.config.container.height;
	this.canvas.width = this.config.container.width;

	this.context = this.canvas.getContext("2d");

	this.drawClock(0, 0, 0, 0);

	this.startTick();
}

//Methods to draw the stopwatch
Stopwatch.prototype.drawClock = function (hour, minute, second, millisecond) {
	this.context.clearRect(0, 0, this.config.container.width, this.config.container.height);

	this.drawface();
	this.drawUnits();
	this.innerShadow();
	this.drawText(hour, minute, second);
	this.drawTime(minute, second, millisecond);
	this.drawHands(hour, minute, second, millisecond);
}

//Method to draw the hands (minutes and seconds are switched... TODO: fix that)
Stopwatch.prototype.drawHands = function(hour, second, minute, millisecond) {
	this.context.save();

	this.context.translate(this.config.container.width/2,this.config.container.height/2);
	this.context.rotate(Math.PI * (2.0 * ((minute + (millisecond/1000.0))/60) - 0.5));
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

	this.context.save();

	this.context.translate(this.config.container.width/2,this.config.container.height/3.5);
	this.context.rotate(Math.PI * (2.0 * ((second + (minute / 60.0)) / 60) - 0.5));
	this.context.globalAlpha = this.config.minute.hand.alpha;
	this.context.strokeStyle = this.config.minute.hand.color;
	this.context.lineWidth = this.config.minute.hand.width;
	this.context.lineCap = "round";
	this.context.shadowOffsetX = 0;
	this.context.shadowOffsetY = 4;
	this.context.shadowBlur = 2;
	this.context.shadowColor = "rgba(0, 0, 0, 0.2)";

	this.context.beginPath();
	this.context.moveTo(0, 0);
	this.context.lineTo(this.config.minute.hand.length - 5, 0);
	this.context.closePath();

	this.context.stroke();

	this.context.restore();

	this.context.save();
	this.context.beginPath();
	this.context.arc(this.config.container.width/2, this.config.container.height/3.5, 4, 0, Math.PI*2, false);
	this.context.closePath();
	this.context.fillStyle = this.config.minute.hand.color;
	this.context.fill();
	this.context.restore();

	this.context.save();
	this.context.beginPath();
	this.context.arc(this.config.container.width/2, this.config.container.height/3.5, 1, 0, Math.PI*2, false);
	this.context.closePath();
	this.context.fillStyle = this.config.minute.unit.major.color;
	this.context.fill();
	this.context.restore();
}

//Method to draw the number
Stopwatch.prototype.drawText = function(hour, minute, second, millisecond) {
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

	//Numbers for minutes face
	for (var i = 0; i < 12; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/3.5);
		this.context.rotate(Math.PI * (2.0 * (i/12) - 0.5));
		this.context.translate(this.config.minute.face.radius - 13, 0);
		this.context.rotate((Math.PI * (2.0 * (i/12) - 0.5) * -1));

		var alpha = this.config.minute.unit.major.alpha;

		this.context.globalAlpha = alpha;

		this.context.fillStyle = this.config.minute.unit.major.color;
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
		this.context.shadowColor = "rgba(0, 0, 0, 0.8)";
		this.context.font = "600 10px 'Open Sans'";
		this.context.textBaseline = 'middle';
		this.context.textAlign = "center";

		var textValue = '';
		if (i === 0) {
			textValue = 60;
		}
		else if (i % 2 === 0) {
			textValue = i * 5;
		}

		this.context.fillText(textValue, 0, 0);
		this.context.restore();
	}
}

//Method to draw the units
Stopwatch.prototype.drawUnits = function() {
	//Draw units for main face
	for (var i = 0; i < 60 * 5; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/2);
		this.context.rotate(Math.PI * (2.0 * (i/(60*5)) - 0.5));
		this.context.globalAlpha = this.config.unit.major.alpha;
		this.context.strokeStyle = this.config.unit.major.color;

		if (i % 5 === 0) {
			if (i % 25 === 0) {
				this.context.lineWidth = this.config.unit.major.width;
				var length = this.config.unit.major.length;
			}
			else {
				this.context.lineWidth = this.config.unit.mid.width;
				var length = this.config.unit.mid.length;
			}
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

	//Draw units for minutes face
	for (var i = 0; i < 60; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/3.5);
		this.context.rotate(Math.PI * (2.0 * (i / 60) - 0.5));
		this.context.globalAlpha = this.config.minute.unit.major.alpha;
		this.context.strokeStyle = this.config.minute.unit.major.color;

		if (i % 5 === 0) {
			if (i % 15 === 0) {
				this.context.lineWidth = this.config.minute.unit.major.width;
				var length = this.config.minute.unit.major.length;
			}
			else {
				this.context.lineWidth = this.config.minute.unit.mid.width;
				var length = this.config.minute.unit.mid.length;
			}
		}
		else {
			this.context.lineWidth = this.config.minute.unit.minor.width;
			var length = this.config.minute.unit.minor.length;
		}

		this.context.beginPath();
		this.context.moveTo(this.config.minute.face.radius - length, 0);
		this.context.lineTo(this.config.minute.face.radius, 0);
		this.context.closePath();
		this.context.stroke();
		this.context.restore();
	}
}

Stopwatch.prototype.drawTime = function(minute, second, millisecond) {
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
	millisecond = parseInt(millisecond / 100);

	var textValue = minute + ':' + second + ':' + millisecond;

	this.context.fillText(textValue, 0, 0);
	this.context.restore();
}

Stopwatch.prototype.startTiming = function() {
	this.timing = true;
}

Stopwatch.prototype.stopTiming = function() {
	this.timing = false;
}

Stopwatch.prototype.resetWatch = function() {
	this.timing = false;
	this.time_passed = new Date(0)
	this.drawClock(0, 0, 0, 0);
}

//Method to fire ten times each second and redraw the clock
Stopwatch.prototype.tick = function() {
	if (this.timing) {
		this.time_passed.setTime(this.time_passed.getTime() + 100);
		var minute = this.time_passed.getMinutes();
		var second = this.time_passed.getSeconds();
		var millisecond = this.time_passed.getMilliseconds();
		this.drawClock(0, minute, second, millisecond);
	}
}

Stopwatch.prototype.startTick = function() {
	var inst = this;
	this.tickId = setInterval(function() { inst.tick(); }, 100);
}
