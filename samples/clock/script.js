var local;
var local_class;
var clocks = {};
var alarms = {};
var alarm_clocks = {};

var base_url = 'http://api.worldweatheronline.com/free/v1/tz.ashx?key=vfc3k7q22tjedr2rxse7xzke&format=json&q=';

var view = 'world';

var stopwatch;
var timer;

$(document).ready(function() {

	$('.close').click(function() {
		window.close();
	});

	$('.menu-item.world').tipTip({ edgeOffset: -5, defaultPosition: 'top' });
	$('.menu-item.alarm').tipTip({ edgeOffset: -5, defaultPosition: 'top' });
	$('.menu-item.timer').tipTip({ edgeOffset: -5, defaultPosition: 'top' });
	$('.menu-item.stopwatch').tipTip({ edgeOffset: -5, defaultPosition: 'top' });

	setInterval(function() {
		if (view == 'world' && !navigator.onLine)
			$('.menu-item.new-world').addClass('hidden');
		else if (view == 'world')
			$('.menu-item.new-world').removeClass('hidden');
	})

	$('.menu-item.world').click(function() {
		$('.menu-item.button').addClass('hidden');
		$('#container > div').addClass('hidden');
		$('#container .world').removeClass('hidden');
		$('.menu-item').removeClass('selected');
		$('.menu-item.world').addClass('selected');
		view = 'world';
		if (sizeOf(clocks) == 0)
			$('.menu-item.new-world').click();
		$('.new-world').removeClass('hidden');
	});

	$('.menu-item.alarm').click(function() {
		$('.menu-item.button').addClass('hidden');
		$('#container > div').addClass('hidden');
		$('#container .alarm').removeClass('hidden');
		$('.menu-item').removeClass('selected');
		$('.menu-item.alarm').addClass('selected');
		view = 'alarm';
		if (sizeOf(alarms) == 0)
			$('.menu-item.new-alarm').click();
		$('.new-alarm').removeClass('hidden');
	});

	$('.menu-item.timer').click(function() {
		$('.menu-item.button').addClass('hidden');
		$('#container > div').addClass('hidden');
		$('#container .timer').removeClass('hidden');
		$('.menu-item').removeClass('selected');
		$('.menu-item.timer').addClass('selected');
		view = 'timer';
	});

	$('.menu-item.stopwatch').click(function() {
		$('.menu-item.button').addClass('hidden');
		$('#container > div').addClass('hidden');
		$('#container .stopwatch').removeClass('hidden');
		$('.menu-item').removeClass('selected');
		$('.menu-item.stopwatch').addClass('selected');
		view = 'stopwatch';
	});

	$('.menu-item.new-world').click(function() {
		openNewClock();
	});

	$('.menu-item.new-alarm').click(function() {
		openNewAlarm();
	});

	$('.world .new .add').click(function() {
		addWorldClock();
	});

	$('.alarm .new .add').click(function() {
		addAlarmClock();
	});

	$('#new-city').keyup(function(event) {
		if (event.which == 13) $('.world .new .add').click();
	});

	$('.world .new .cancel').click(function() {
		$('.world .new #new-city').val('');
		$('.world .new #new-city').removeClass('form-error');
		$('.new .error-message').addClass('hidden');
		$('.new .error-message').html('');
		$('.world .new').addClass('hidden');
		resize();
	});

	$('.alarm .new .cancel').click(function() {
		$('.alarm .new #new-alarm-name').val('');
		$('#new-alarm-hour').val('');
		$('#new-alarm-minute').val('');
		$('#new-alarm-noon').val('');
		$('.alarm .new').addClass('hidden');
		resize();
	});

	$('.alarm .edit .cancel').live('click', function() {
		var id = $(this).parent().attr('class').split(' ')[0];
		$('.edit.' + id).addClass('hidden');
		$('.info.' + id).removeClass('hidden');
		$(this).parent().parent().removeClass('editing');
	});

	$('.alarm .edit .save').live('click', function() {
		var id = $(this).parent().attr('class').split(' ')[0];
		editAlarmClock(id);
		$('.edit.' + id).addClass('hidden');
		$('.info.' + id).removeClass('hidden');
		$(this).parent().parent().removeClass('editing');
	});

	createDefaultText('00', $('#timer-minute'));
	createDefaultText('00', $('#timer-second'));

	$('#timer-minute').keyup(function() {
		if ($('#timer-minute').val() != '00') {
			$('.timer .button.start').removeClass('disabled');
		}
	});
	$('#timer-second').keyup(function() {
		if ($('#timer-second').val() != '00') {
			$('.timer .button.start').removeClass('disabled');
		}
	});

	$('.timer .button.start').click(function() {
		if (!$(this).hasClass('disabled')) {
			var minute = parseInt($('#timer-minute').val()) % 60;
			var second = parseInt($('#timer-second').val()) % 60;
			if (isNaN(minute)) {
				minute = 0;
				$('#timer-minute').val('00');
			} if (isNaN(second)) {
				second = 0;
				$('#timer-second').val('00');
			}
			timer.setWatch(minute, second);
			timer.startTiming();
			$('.timer #timer-minute').addClass('disabled');
			$('.timer #timer-second').addClass('disabled');
			$('.timer .button.start').addClass('hidden');
			$('.timer .button.stop').removeClass('disabled');
			$('.timer .button.stop').removeClass('hidden');
			$('.timer .button.reset').removeClass('disabled');
		}
	});

	$('.timer .button.stop').click(function() {
		timer.stopTiming();
		$('.timer .button.start').removeClass('hidden');
		$('.timer .button.stop').addClass('hidden');
	});

	$('.timer .button.reset').click(function() {
		$('.timer .button.start').removeClass('hidden');
		$('.timer .button.stop').addClass('hidden');
		$('.timer .button.start').addClass('disabled');
		$('.timer .button.reset').addClass('disabled');
		timer.resetWatch();
		$('.timer #timer-minute').val('00');
		$('.timer #timer-second').val('00');
		$('.timer #timer-minute').removeClass('disabled');
		$('.timer #timer-second').removeClass('disabled');
	});

	$('.stopwatch .button.start').click(function() {
		stopwatch.startTiming();
		$('.stopwatch .button.start').addClass('hidden');
		$('.stopwatch .button.stop').removeClass('hidden');
	});

	$('.stopwatch .button.stop').click(function() {
		stopwatch.stopTiming();
		$('.stopwatch .button.start').removeClass('hidden');
		$('.stopwatch .button.stop').addClass('hidden');
	});

	$('.stopwatch .button.reset').click(function() {
		stopwatch.resetWatch();
		$('.stopwatch .button.start').removeClass('hidden');
		$('.stopwatch .button.stop').addClass('hidden');
	});

	$('.delete').live('click', function() {
		var class_name = $(this).parent().attr('class').split(' ')[1];
		$('.' + class_name).remove();
		if (view == 'alarm') {
			var num = parseInt(class_name.slice(1));
			var cur_num = sizeOf(alarms);
			if (cur_num === 1) {
				delete alarms[class_name];
				delete alarm_clocks[class_name];
			}
			else {
				while (cur_num > num) {
					var id = 'a' + cur_num;
					var alarm = alarms[id];
					var alarm_clock = alarm_clocks[id];
					delete alarms[id];
					delete alarm_clocks[id];
					cur_num -= 1;
					alarms['a' + cur_num] = alarm;
					alarm_clocks['a' + cur_num] = alarm_clock;
					$('.' + id).removeClass(id).addClass('a' + cur_num);
				}
			}
		}
		delete clocks[class_name];
		chrome.storage.sync.set({ 'clocks': clocks, 'alarms': alarms });
		if (sizeOf(clocks) == 0)
			$('.menu-item.new-world').click();
		if (sizeOf(alarms) == 0)
			$('.menu-item.new-alarm').click();

		resize();
	});

	$('.info').live('click', function() {
		$(this).parent().addClass('editing');
		var id = $(this).attr('class').split(' ')[0];
		var hour = parseInt(alarms[id]['hour']);
		var minute = parseInt(alarms[id]['minute']);
		var noon = 'AM';
		if (hour == 12) {
			noon = 'PM';
		}
		if (hour > 12) {
			noon = 'PM';
			hour -= 12;
		}
		if (hour == 0) {
			hour = 12;
		}
		if (hour < 10) {
			hour = '0' + hour;
		}
		if (minute < 10) {
			minute = '0' + minute;
		}
		$('.' + id + ' .edit-alarm-name').val(alarms[id]['name']);
		$('.' + id + ' .edit-alarm-hour').val(hour);
		$('.' + id + ' .edit-alarm-minute').val(minute);
		$('.' + id + ' .edit-alarm-noon').val(noon);
		$(this).addClass('hidden');
		$('.' + id + '.edit').removeClass('hidden');
	});

	$(window).resize(function() {
		resize();
	});

	setup();

});

function createDefaultText(default_text, $input) {
	$input.css('color', '#666');
	$input.val(default_text);
	$input.focus(function() {
		var actual_text = $input.val();
		if (actual_text == default_text) {
			$input.val('');
			$input.css('color', '#333');
		}
	});
	$input.blur(function() {
		var actual_text = $input.val();
		if (!actual_text) {
			$input.val(default_text);
			$input.css('color', '#666');
		}
	});
}

function openNewClock() {
	$('.world .new').removeClass('hidden');
	$('#new-city').focus();
	resize();
}

function openNewAlarm() {
	var default_text = 'Alarm ' + (sizeOf(alarms) + 1);
	var $input = $('#new-alarm-name');
	createDefaultText(default_text, $input);
	createDefaultText('00', $('#new-alarm-hour'));
	createDefaultText('00', $('#new-alarm-minute'));
	createDefaultText('AM', $('#new-alarm-noon'));
	$('.alarm .new').removeClass('hidden');
	resize();
}

function setup() {
	chrome.storage.sync.get(function(items) {
		for (var clock_class in items['clocks']) {
			clocks[clock_class] = items['clocks'][clock_class];
		}
		for (var alarm_class in items['alarms']) {
			alarms[alarm_class] = items['alarms'][alarm_class];
		}
		local = items['local'];

		navigator.geolocation.getCurrentPosition(getCurrentPosSuccessFunction,
    																			 	 getCurrentPosErrorFunction);
	});
}

function setupClocks() {
	var clock = new Clock('new', 0);
	clock.create();
	var found_local = false;
	for (var city_class in clocks) {
		if (city_class == local_class) found_local = true;
		addClock(city_class);
	}
	if (local_class && !found_local) addClock(local_class);
	if (sizeOf(clocks) == 0) {
		$('.menu-item.new-world').click();
	}
}

function setupAlarms() {
	var alarm = new Alarm('new', 'new', 0, 0, 0);
	alarm.create();
	for (var id in alarms) {
		addAlarm(id);
	}
	if (sizeOf(alarms) == 0)
		$('.menu-item.new-alarm').click();
}

function setupTimer() {
	timer = new Timer();
	timer.create();
}

function setupStopwatch() {
	stopwatch = new Stopwatch();
	stopwatch.create();
}

function getCurrentPosSuccessFunction(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var url = encodeURI(base_url + lat + ',' + lng);
	$.get(url,
		function(data) {
			if (!data['data']['error']) {
				local = parseInt(data['data']['time_zone'][0]['utcOffset']);
				chrome.storage.sync.set({ 'local' : local });
			}
		},
		'json'
	);
	setupClocks();
	setupAlarms();
	setupTimer();
	setupStopwatch();
}

function getCurrentPosErrorFunction(error) {
  console.log("Geocoder failed");
  local = -new Date().getTimezoneOffset()/60;
  setupClocks();
  setupAlarms();
  setupTimer();
	setupStopwatch();
}

// Function adds a canvas element and initializes a new clock for that canvas
function addClock(city_class) {
	var city = clocks[city_class][0];
	var offset = clocks[city_class][1] - local;
	$('#container .world .new').before('<div class="city-clock ' + city_class + '"></div>');
	$('.' + city_class).append('<div class="delete"></div>');
	$('.' + city_class).append('<canvas class="clock"></canvas>');
	$('.' + city_class).append('<div class="city">' + city + '</div>');
	$('.' + city_class).append('<div class="time"></div>');
	$('.' + city_class).append('<div class="day"></div>');
	var clock = new Clock(city_class, offset);
	clock.create();
	resize();
}

// Function adds a canvas element and initializes a new alarm for that canvas
function addAlarm(id) {
	var alarm = alarms[id];
	var edit = '<div class="' + id + ' edit hidden">\
								<input type="text" class="edit-alarm-name" /><br>\
								<input type="text" class="edit-alarm-hour" maxlength="2" />\
								<input type="text" class="edit-alarm-minute" maxlength="2" />\
								<input type="text" class="edit-alarm-noon" maxlength="2" /><br>\
								<div class="button save">Save</div>\
								<div class="button cancel">Cancel</div>\
							</div>';
	var info = '<div class="' + id + ' info">\
								<div class="name">' + alarm['name'] + '</div>\
								<div class="time"></div>\
							</div>'
	$('#container .alarm .new').before('<div class="alarm-clock ' + id + '"></div>');
	$('.alarm-clock.' + id).append('<div class="delete"></div>');
	$('.alarm-clock.' + id).append('<canvas class="clock"></canvas>');
	$('.alarm-clock.' + id).append(info);
	$('.alarm-clock.' + id).append(edit);
	var alarm_clock = new Alarm(id,
															alarm['name'],
															alarm['hour'],
															alarm['minute'],
															alarm['on']);
	alarm_clock.create();
	alarm_clocks[id] = alarm_clock;
	resize();
}

function addWorldClock() {
	var city = $('.world .new #new-city').val();
	if (city.split(' ').join('-') in clocks) {
		$('.world .new .button.cancel').click();
	}
	else {
		var url = encodeURI(base_url + city);
		$.get(url,
			function(data) {
				if (data['data']['error']) {
					var city = $('.world .new #new-city').val();
					$('.world .new #new-city').addClass('form-error');
					$('.new .error-message').html('Could not find the time for ' + city + '.<br>');
					$('.new .error-message').removeClass('hidden');
				}
				else {
					var city = data['data']['request'][0]['query'].split(', ')[0];
					var city_class = city.split(' ').join('-');
					var time_zone = parseInt(data['data']['time_zone'][0]['utcOffset']);
					clocks[city_class] = [city, time_zone];
					chrome.storage.sync.set({ 'clocks' : clocks });
					addClock(city_class);
					$('.world .new #new-city').val('');
					$('.new .error-message').html('');
					$('.world .new').addClass('hidden');
				}
			},
			'json'
		);
	}
}

function addAlarmClock() {
	var name = $('#new-alarm-name').val();
	var hour = parseInt($('#new-alarm-hour').val());
	var minute = parseInt($('#new-alarm-minute').val());
	if (isNaN(hour)) {
		hour = 12;
	} if (isNaN(minute)) {
		minute = 0;
	}
	var noon = $('#new-alarm-noon').val();
	if (noon.toLowerCase() == 'pm' && hour != 12) hour += 12;
	else if (noon.toLowerCase() == 'am' && hour == 12) hour -= 12;
	var id = 'a' + (sizeOf(alarms) + 1);
	alarm = { 'name' : name, 'hour' : hour, 'minute' : minute, 'on' : true };
	alarms[id] = alarm;
	chrome.storage.sync.set({ 'alarms' : alarms });
	$('#new-alarm-name').val('');
	$('#new-alarm-hour').val('');
	$('#new-alarm-minute').val('');
	$('#new-alarm-noon').val('');
	addAlarm(id);
	$('.alarm .new').addClass('hidden');
}

function editAlarmClock(id) {
	var name = $('.edit.' + id + ' .edit-alarm-name').val();
	console.log(name);
	var hour = parseInt($('.edit.' + id + ' .edit-alarm-hour').val());
	var minute = parseInt($('.edit.' + id + ' .edit-alarm-minute').val());
	if (isNaN(hour)) {
		hour = alarms[id]['hour'];
	} if (isNaN(minute)) {
		minute = alarms[id]['minute'];
	}
	var noon = $('.edit.' + id + ' .edit-alarm-noon').val();
	if (noon.toLowerCase() == 'pm' && hour != 12) hour += 12;
	else if (noon.toLowerCase() == 'am' && hour == 12) hour -= 12;
	alarm = { 'name' : name, 'hour' : hour, 'minute' : minute, 'on' : alarms[id]['on'] };
	alarms[id] = alarm;
	alarm_clock = alarm_clocks[id];
	console.log(hour);
	console.log(minute);
	alarm_clock.update(name, hour, minute);
	chrome.storage.sync.set({ 'alarms' : alarms });
	$('.' + id + '.info .name').text(name);
}

function resize() {
	var clock_width = 330.0;
	var clocks_size = sizeOf(clocks);
	if (!$('.world .new').hasClass('hidden'))
		clocks_size += 1;
	var lines = Math.ceil(clock_width * clocks_size / window.innerWidth);
	var height = 350 * lines;
	if (window.innerHeight > height + 100) {
		$('.world').css({ 'top' : '50%', 'margin-top' : '-' + height/2 + 'px' });
	} else {
		$('.world').css({ 'top' : '0px', 'margin-top' : '0px' });
	}

	var alarm_width = 300.0;
	var alarms_size = sizeOf(alarms);
	if (!$('.alarm .new').hasClass('hidden'))
		alarms_size += 1;
	var lines = Math.ceil(alarm_width * alarms_size / window.innerWidth);
	var height = 385 * lines;
	if (window.innerHeight > height) {
		$('.alarm').css({ 'top' : '50%', 'margin-top' : '-' + height/2 + 'px' });
	} else {
		$('.alarm').css({ 'top' : '0px', 'margin-top' : '0px' });
	}
}

function sizeOf(dictionary) {
	var count = 0;
	for (var key in dictionary) {
		if (dictionary.hasOwnProperty(key)) count++;
	}
	return count;
}

