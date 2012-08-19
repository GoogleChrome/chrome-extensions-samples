var local;
var local_class;
var clocks = {};
var alarms = {};

var base_url = 'http://www.worldweatheronline.com/feed/tz.ashx?key=78b33b52eb213218120708&format=json&q=';

var view = 'world';

var stopwatch;
var timer;

$(document).ready(function() {

	$('.menu-item.world').tipTip({ edgeOffset: -5, defaultPosition: 'top' });
	$('.menu-item.alarm').tipTip({ edgeOffset: -5, defaultPosition: 'top' });
	$('.menu-item.timer').tipTip({ edgeOffset: -5, defaultPosition: 'top' });
	$('.menu-item.stopwatch').tipTip({ edgeOffset: -5, defaultPosition: 'top' });

	setInterval(function() {
		if (view == 'world' && !navigator.onLine)
			$('.menu-item.new').addClass('hidden');
		else
			$('.menu-item.new').removeClass('hidden');
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
	});

	$('.alarm .new .cancel').click(function() {
		$('.alarm .new #new-alarm-name').val('');
		$('#new-alarm-hour').val('');
		$('#new-alarm-minute').val('');
		$('#new-alarm-noon').val('');
		$('.alarm .new').addClass('hidden');
	});

	$('.timer .button.start').click(function() {
		if (!$(this).hasClass('disabled')) {
			timer.startTiming();
			$('.timer .button.start').addClass('hidden');
			$('.timer .button.stop').removeClass('disabled');
			$('.timer .button.stop').removeClass('hidden');
		}
	});

	$('.timer .button.stop').click(function() {
		timer.stopTiming();
		$('.timer .button.start').removeClass('hidden');
		$('.timer .button.stop').addClass('hidden');
	});

	$('.timer .button.set').click(function() {
		var minute = parseInt($('#timer-minute').val());
		var second = parseInt($('#timer-second').val());
		if (isNaN(minute)) {
			minute = 0;
			$('#timer-minute').val('00');
		} if (isNaN(second)) {
			second = 0;
			$('#timer-second').val('00');
		}
		$('.timer .button.start').removeClass('disabled');
		timer.setWatch(minute, second);
		$('.timer #timer-minute').addClass('disabled');
		$('.timer #timer-second').addClass('disabled');
		$('.timer .button.set').addClass('hidden');
		$('.timer .button.reset').removeClass('hidden');
	});

	$('.timer .button.reset').click(function() {
		$('.timer .button.start').removeClass('hidden');
		$('.timer .button.stop').addClass('hidden');
		$('.timer .button.start').addClass('disabled');
		timer.resetWatch();
		$('.timer #timer-minute').removeClass('disabled');
		$('.timer #timer-second').removeClass('disabled');
		$('.timer .button.set').removeClass('hidden');
		$('.timer .button.reset').addClass('hidden');
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
		delete alarms[class_name];
		delete clocks[class_name];
		chrome.storage.sync.set({ 'clocks': clocks, 'alarms': alarms });
		if (sizeOf(clocks) == 0)
			$('.menu-item.new-world').click();
		if (sizeOf(alarms) == 0)
			$('.menu-item.new-alarm').click();
	});

	setup();

});

function openNewClock() {
	$('.world .new').removeClass('hidden');
	$('#new-city').focus();
}

function openNewAlarm() {
	var default_name = 'Alarm ' + (sizeOf(alarms) + 1);
	$('#new-alarm-name').css('color', '#666');
	$('#new-alarm-name').val(default_name);
	$('#new-alarm-name').focus(function() {
		var actual_name = $('#new-alarm-name').val();
		if (actual_name == default_name) {
			$('#new-alarm-name').val('');
			$('#new-alarm-name').css('color', '#333');
		}
	});
	$('#new-alarm-name').blur(function() {
		var actual_name = $('#new-alarm-name').val();
		var default_name = 'Alarm ' + (sizeOf(alarms) + 1);
		if (!actual_name) {
			$('#new-alarm-name').val(default_name);
			$('#new-alarm-name').css('color', '#666');
		}
	});
	$('.alarm .new').removeClass('hidden');
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
}

// Function adds a canvas element and initializes a new alarm for that canvas
function addAlarm(id) {
	var alarm = alarms[id];
	$('#container .alarm .new').before('<div class="alarm-clock ' + id + '"></div>');
	$('.' + id).append('<div class="delete"></div>');
	$('.' + id).append('<canvas class="clock"></canvas>');
	$('.' + id).append('<div class="name">' + alarm['name'] + '</div>');
	$('.' + id).append('<div class="time"></div>');
	var alarm_clock = new Alarm(id,
															alarm['name'],
															alarm['hour'],
															alarm['minute'],
															alarm['on']);
	alarm_clock.create();
}

function addWorldClock() {
	var city = $('.world .new #new-city').val();
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

function sizeOf(dictionary) {
	var count = 0;
	for (var key in dictionary) {
		if (dictionary.hasOwnProperty(key)) count++;
	}
	return count;
}

