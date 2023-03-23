Clock = function(id, offset) {

	this.config = {
		container: {height: 240, width: 240},
		face: {color: '#424240', alpha: 1, radius: 120},
		hourHand: {color: '#4d90fe', alpha: 1, length: 70, width: 4},
		minuteHand: {color: '#4d90fe', alpha: 1, length: 90, width: 4},
		unit: {
			major: {color: '#f5f5f5', alpha: 0.4, length: 8, width: 6},
			mid: {color: '#f5f5f5', alpha: 0.4, length: 8, width: 4},
			minor: {color: '#f5f5f5', alpha: 0.4, length: 8, width: 2}
		}
	};
	this.tickId;
	this.offset = offset;
	this.id = id;
}

//Method to initialize the clock
Clock.prototype.create = function(ctx) {

	if (ctx) {
		this.context = ctx;
	}
	else {
		this.canvas = $('.world .' + this.id + ' .clock')[0];
		this.canvas.height = this.config.container.height;
		this.canvas.width = this.config.container.width;
		this.context = this.canvas.getContext("2d");
	}

	this.startTick();
}

//Methods to draw the clock
Clock.prototype.drawClock = function (hour, minute, second) {
	this.context.clearRect(0, 0, this.config.container.width, this.config.container.height);

	this.drawface();
	this.drawUnits();
	this.innerShadow();
	this.drawText(hour, minute, second);
	this.drawHands(hour, minute, second);
}

//Method to draw the clocks face
Clock.prototype.drawface = function () {
	this.context.save();

	this.context.shadowOffsetX = 0;
	this.context.shadowOffsetY = 1;
	this.context.shadowBlur = 1;
	this.context.shadowColor = "rgba(255, 255, 255, 1)";

	this.context.beginPath();
	this.context.arc(this.config.container.width/2, this.config.container.height/2, this.config.face.radius, 0, Math.PI*2, false);
	this.context.closePath();
	this.context.fillStyle = this.config.face.color;
	this.context.fill();
	this.context.restore();
}

//Method to draw an inner shadow on the clock face
Clock.prototype.innerShadow = function() {
	this.context.save();

	this.context.strokeStyle = "rgba(0, 0, 0, 0.3)";
	this.context.shadowOffsetX = 0;
	this.context.shadowOffsetY = 1;
	this.context.shadowBlur = 1;
	this.context.shadowColor = "rgba(0, 0, 0, 0.3)";

	this.context.beginPath();
	this.context.arc(this.config.container.width/2, this.config.container.height/2, this.config.face.radius, Math.PI, 0);
	this.context.stroke();
	this.context.restore();
}


//Method to draw the hands
Clock.prototype.drawHands = function(hour, minute, second) {
	this.context.save();

	this.context.translate(this.config.container.width/2, this.config.container.height/2);
	this.context.rotate(Math.PI * (2.0 * (((hour%12)*5 + minute/12.0)/60) - 0.5));
	this.context.globalAlpha = this.config.hourHand.alpha;
	this.context.strokeStyle = this.config.hourHand.color;
	this.context.lineWidth = this.config.hourHand.width;
	this.context.lineCap = "round";
	this.context.shadowOffsetX = 0;
	this.context.shadowOffsetY = 4;
	this.context.shadowBlur = 2;
	this.context.shadowColor = "rgba(0, 0, 0, 0.2)";

	this.context.beginPath();
	this.context.moveTo(-8, 0);
	this.context.lineTo(this.config.hourHand.length - 5, 0);
	this.context.closePath();

	this.context.stroke();

	this.context.restore();


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
	this.context.moveTo(-8, 0);
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
Clock.prototype.drawText = function(hour, minute, second) {
	for (var i = 0; i < 12; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/2);
		this.context.rotate(Math.PI * (2.0 * (i/12) - 0.5));
		this.context.translate(this.config.face.radius - 24, 0);
		this.context.rotate((Math.PI * (2.0 * (i/12) - 0.5) * -1));

		var alpha = this.config.unit.major.alpha;

		if (i === 0) j = 11;
		else j = i - 1;
		var textValue = '';
		if ((hour % 12) === i) {
			alpha += (1-this.config.unit.major.alpha);
			if (i === 0) textValue = 12;
			else textValue = i;
		}

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

//Method to draw the units
Clock.prototype.drawUnits = function() {
	for (var i = 0; i < 60; i++) {
		this.context.save();
		this.context.translate(this.config.container.width/2, this.config.container.height/2);
		this.context.rotate(Math.PI * (2.0 * (i/60) - 0.5));
		this.context.globalAlpha = this.config.unit.major.alpha;
		this.context.strokeStyle = this.config.unit.major.color;

		if (i  % 5 === 0) {
			if (i % 15 === 0) {
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
}

Clock.prototype.displayTime = function(hours, minutes, displayDay) {
 	var day = ' &bull; Today';
  var noon = ' AM';

  if (minutes < 0) {
  	minutes += 60;
  	hours -= 1;
  } else if (minutes > 59) {
  	minutes -= 60;
  	hours += 1;
  }
  if (minutes < 10) minutes = '0' + minutes;

  if (hours < 0) {
  	day = ' &bull; Yesterday';
  	hours += 24;
  } else if (hours >= 24) {
  	day = ' &bull; Tomorrow';
  	hours -= 24;
  }

  if (hours >= 12) noon = ' PM';
  if (hours > 12) hours -= 12;
  if (hours == 0) hours = 12;

  var time = hours + ':' + minutes + noon;

  $('.' + this.id + ' .time').html(time);
  if (displayDay) $('.' + this.id + ' .day').html(day);
}

//Method to fire each second and redraw the clock
Clock.prototype.tick = function() {
	var str_offset = (this.offset + '').split('.');
	var hours_offset = parseInt(str_offset[0]);
	var minutes_offset = 0;
	if (str_offset.length > 1) minutes_offset = parseInt(str_offset[1]);

  var now = new Date();
  var hours = now.getHours() + hours_offset;
  var minutes = now.getMinutes() + minutes_offset;
  var seconds = now.getSeconds();

 	this.drawClock(hours, minutes, seconds);

 	this.displayTime(hours, minutes, true);
}

Clock.prototype.startTick = function() {
	var inst = this;
	this.tickId = setInterval(function() { inst.tick(); }, 1000);
}

Clock.prototype.stopTick = function() {
	clearInterval(tickId);
}






