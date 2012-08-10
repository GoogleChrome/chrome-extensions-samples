/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var temp = 'F';
var places = {};
var current_place = '';
var base_weather_url = 'http://free.worldweatheronline.com/feed/weather.ashx?format=json&num_of_days=5&key=78b33b52eb213218120708&q=';
var base_city_url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&latlng=';

var days = { 0 : 'Sunday',
						 1 : 'Monday',
						 2 : 'Tuesday',
						 3 : 'Wednesday',
						 4 : 'Thursday',
						 5 : 'Friday',
						 6 : 'Saturday'
					 }

var condition_codes = { 395 : 'snow',
												392 : 'light-snow',
												389 : 'rain',
												386 : 'scattered-light-rain',
												377 : 'hail',
												374 : 'hail',
												371 : 'snow',
												368 : 'light-snow',
												365 : 'rain-snow',
												362 : 'rain-snow',
												359 : 'rain',
												356 : 'rain',
												353 : 'light-rain',
												350 : 'hail',
												338 : 'snow',
												335 : 'scattered-snow',
												332 : 'snow',
												329 : 'scattered-snow',
												326 : 'light-snow',
												323 : 'light-snow',
												320 : 'rain-snow',
												317 : 'rain-snow',
												314 : 'hail',
												311 : 'rain',
												308 : 'rain',
												305 : 'rain',
												302 : 'rain',
												299 : 'light-rain',
												296 : 'light-rain',
												293 : 'scattered-light-rain',
												284 : 'rain-snow',
												281 : 'rain-snow',
												266 : 'light-rain',
												263 : 'scattered-light-rain',
												260 : 'cloudy',
												248 : 'cloudy',
												230 : 'snow',
												227 : 'snow',
												200 : 'tstorm',
												185 : 'rain-snow',
												182 : 'rain-snow',
												113 : 'sunny',
												116 : 'partly-cloudy',
												119 : 'cloudy',
												122 : 'cloudy',
												143 : 'mostly-sunny',
												176 : 'scattered-light-rain',
												179 : 'light-snow'
											}


// "current_condition": [ { "cloudcover": "0",
// 												 "humidity": "51",
// 												 "observation_time": "09:04 PM",
// 												 "precipMM": "0.0",
// 												 "pressure": "1012",
// 												 "temp_C": "27",
// 												 "temp_F": "81",
// 												 "visibility": "14",
// 												 "weatherCode": "113",
// 												 "weatherDesc": [ {"value": "Sunny" } ],
// 												 "weatherIconUrl": [ {"value": "http:\/\/www.worldweatheronline.com\/images\/wsymbols01_png_64\/wsymbol_0001_sunny.png" } ],
// 												 "winddir16Point": "S",
// 												 "winddirDegree": "190",
// 												 "windspeedKmph": "20",
// 												 "windspeedMiles": "13"
// 											 }
// 										 ],
// "request": [ { "query": "Toronto, Canada",
// 							 "type": "City"
// 						 }
// 					 ],
// "weather": [ { "date": "2012-08-07",
// 							 "precipMM": "0.0",
// 							 "tempMaxC": "32",
// 							 "tempMaxF": "89",
// 							 "tempMinC": "20",
// 							 "tempMinF": "67",
// 							 "weatherCode": "113",
// 							 "weatherDesc": [ {"value": "Sunny" } ],
// 							 "weatherIconUrl": [ {"value": "http:\/\/www.worldweatheronline.com\/images\/wsymbols01_png_64\/wsymbol_0001_sunny.png" } ],
// 							 "winddir16Point": "SSW",
// 							 "winddirDegree": "198",
// 							 "winddirection": "SSW",
// 							 "windspeedKmph": "16",
// 							 "windspeedMiles": "10"
// 							},
// 							{"date": "2012-08-08", "precipMM": "0.0", "tempMaxC": "32", "tempMaxF": "90", "tempMinC": "18", "tempMinF": "65", "weatherCode": "113",  "weatherDesc": [ {"value": "Sunny" } ],  "weatherIconUrl": [ {"value": "http:\/\/www.worldweatheronline.com\/images\/wsymbols01_png_64\/wsymbol_0001_sunny.png" } ], "winddir16Point": "NNW", "winddirDegree": "337", "winddirection": "NNW", "windspeedKmph": "21", "windspeedMiles": "13" },
// 							{"date": "2012-08-09", "precipMM": "2.1", "tempMaxC": "25", "tempMaxF": "77", "tempMinC": "17", "tempMinF": "63", "weatherCode": "296",  "weatherDesc": [ {"value": "Light rain" } ],  "weatherIconUrl": [ {"value": "http:\/\/www.worldweatheronline.com\/images\/wsymbols01_png_64\/wsymbol_0017_cloudy_with_light_rain.png" } ], "winddir16Point": "N", "winddirDegree": "7", "winddirection": "N", "windspeedKmph": "19", "windspeedMiles": "12" },
// 							{"date": "2012-08-10", "precipMM": "3.5", "tempMaxC": "23", "tempMaxF": "73", "tempMinC": "18", "tempMinF": "64", "weatherCode": "116",  "weatherDesc": [ {"value": "Partly Cloudy" } ],  "weatherIconUrl": [ {"value": "http:\/\/www.worldweatheronline.com\/images\/wsymbols01_png_64\/wsymbol_0002_sunny_intervals.png" } ], "winddir16Point": "ENE", "winddirDegree": "63", "winddirection": "ENE", "windspeedKmph": "26", "windspeedMiles": "16" },
// 							{"date": "2012-08-11", "precipMM": "3.8", "tempMaxC": "23", "tempMaxF": "73", "tempMinC": "18", "tempMinF": "64", "weatherCode": "266",  "weatherDesc": [ {"value": "Light drizzle" } ],  "weatherIconUrl": [ {"value": "http:\/\/www.worldweatheronline.com\/images\/wsymbols01_png_64\/wsymbol_0017_cloudy_with_light_rain.png" } ], "winddir16Point": "NE", "winddirDegree": "38", "winddirection": "NE", "windspeedKmph": "28", "windspeedMiles": "17" }
// 						]


$(document).ready(function() {

	chrome.storage.local.get(function(items) {
		for (var place_class in items['places']) {
			places[place_class] = items['places'][place_class];
		}
		temp = items['temp'];
		if (!temp) temp = 'F';
		$('input[name="temp-type"].' + temp).attr('checked', true);
  	setup();
  });

  $('input[name="temp-type"]').change(function() {
  	temp = $('input[name="temp-type"]:checked').val();
  	chrome.storage.local.set({ 'temp' : temp });
  	refresh();
  });

	$('#places .place').live('click', function() {
		$('#weather').removeClass('hidden');
		$('#info-text').addClass('hidden');
		var city_class = $(this).attr('class').split(' ')[1];
		$('.location').removeClass('selected');
		$('.place').removeClass('selected');
		$('.' + city_class).addClass('selected');
		current_place = city_class;
		$('#new-city').val('');
	});

	$('.delete').live('click', function() {
		var city_class = $(this).parent().attr('class').split(' ')[1];
		$('.' + city_class).remove();
		delete places[city_class];
		if (sizeOf(places) == 0)
			current_place = 'new';
		else {
			for (var place_class in places) {
				current_place = place_class;
				break;
			}
		}
		$('.' + current_place).addClass('selected');
		chrome.storage.local.set({ 'places': places });
	});

	$('#places #plus').live('click', function() {
		$('#weather').removeClass('hidden');
		$('#info-text').addClass('hidden');
		$('.location').removeClass('selected');
		$('.place').removeClass('selected');
		$('.location.new').addClass('selected');
		$('#new-city').focus();
	});

	$('.location.new .add').click(function() {
		var location = $('#new-city').val();
		current_place = location.toLowerCase().split(', ')[0].split(' ').join('-');
		var new_place = {};
		new_place[current_place] = location;
		createDisplay(new_place, true);
	});

	$('#new-city').keyup(function(event) {
		if (event.which == 13)
			$('.location.new .add').click();
	})

	$('.location.new .cancel').click(function() {
		$('#new-city').val('');
		$('.new').removeClass('selected');
		$('input#new-city').removeClass('form-error');
		$('.new .error-message').addClass('hidden');
		var city_class = current_place.split(', ')[0].split(' ').join('-');
		$('.' + city_class).addClass('selected');
	});

	$('#info').click(function() {
		$('#weather').addClass('hidden');
		$('#info-text').removeClass('hidden');
	})

});

function setup() {
	navigator.geolocation.getCurrentPosition(getCurrentPosSuccessFunction,
    																			 getCurrentPosErrorFunction);
}

function refresh() {
	for (var location_class in places) {
		$('.' + location_class).remove();
	}
	createDisplay(places);
}

function getCurrentPosSuccessFunction(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var url = base_city_url + lat + ',' + lng;
  $.get(url,
		function(data) {
			for (var i = 0; i < data['results'].length; i++) {
				var component_types = data['results'][i]['types'];
				if ( (component_types.indexOf('street_address') != -1)
					  || (component_types.indexOf('locality') != -1) ) {
					var address_components = data['results'][i]['address_components'];
					var city = '';
					var country = '';
					for (var j = 0; j < address_components.length; j++) {
						if (address_components[j]['types'].indexOf('locality') != -1) {
							city = address_components[j]['long_name'];
						}
						if (address_components[j]['types'].indexOf('country') != -1) {
							country = address_components[j]['short_name'];
						}
					}
					var location = city + ', ' + country;
					current_place = city.toLowerCase().split(' ').join('-');
					if (!(current_place in places))
						places[current_place] = location;
					break;
				}
			}
			createDisplay(places);
		},
		'json'
	);
}

function getCurrentPosErrorFunction(error) {
  console.log("Geocoder failed");
  for (place in places) {
  	current_place = places[place];
  	break;
  }
  if (current_place == '')
  	current_place = 'new';
}

function createDisplay(locations, add) {
	for (var location_class in locations) {
		var location = locations[location_class];
		var url = encodeURI(base_weather_url + location);
		$.get(url,
			function(data) {
				if (!data['data']['error']) {
					var current_condition = data['data']['current_condition'][0];
					var weather = data['data']['weather'];
					var city = data['data']['request'][0]['query'];
					addLocationDisplay(city, current_condition, weather);
					if (add) {
						$('input#new-city').removeClass('form-error');
						$('input#new-city').val('');
						$('.new .error-message').addClass('hidden');
						$('.new').removeClass('selected');
						places[location_class] = location;
						chrome.storage.local.set({ 'places': places });
					}
				}
				else if (add) {
					$('input#new-city').addClass('form-error');
					$('.new .error-message').text('Could not find weather for ' + location);
					$('.new .error-message').removeClass('hidden');
				}
			},
			'json'
		);
	}
}

function addLocationDisplay(location, current_condition, weather) {
	var city_class = location.toLowerCase().split(', ')[0].split(' ').join('-');
	var selected = '';
	if (city_class == current_place) selected = ' selected';
	var location_html = '<div class="location ' + city_class + selected + '">\
	                     </div>';
	var city = location.split(', ')[0];
	var location_dot_html = '<div class="place ' + city_class + selected + '"\
																title="' + city + '"></div>';
	var city_html = cityDisplay(location);
	var places_list_html = placesListItem(city_class, city);
	var current_html = currentDisplay(current_condition);
	var day_html = '';
	for (var i = 0; i < weather.length; i++)
		day_html += dayDisplay(weather, i);
	$('#info-text .places-list').append(places_list_html);
	$('#weather').append(location_html);
	$('#weather .' + city_class).append(city_html);
	$('#weather .' + city_class).append(current_html);
	$('#weather .' + city_class).append(day_html);
	$('#places #plus').before(location_dot_html);
	$('#places .' + city_class).tipTip({ edgeOffset: -2 });
	$('.current-icon').tipTip({ edgeOffset: -6 });
	$('.icon').tipTip({ edgeOffset: -6, defaultPosition: 'left' });
}

function cityDisplay(location) {
	var city = location.split(', ')[0];
  var html = '<div class="city">' + city + '</div>';
  return html;
}

function currentDisplay(current_condition) {
	var current_temp = current_condition['temp_' + temp];
	var current_description = current_condition['weatherDesc'][0]['value'];
	var current_icon = condition_codes[current_condition['weatherCode']];
	var html = '<div class="current">\
	              <div class="current-icon ' + current_icon + '"\
	              		 title="' + current_description + '"></div>\
	              <div class="current-temp">' + current_temp + '&deg;</div>\
	            </div>';
	return html;
}

function dayDisplay(weather, i) {
	var day_data = weather[i];
	var day_condition = condition_codes[day_data['weatherCode']];
	var day_description = day_data['weatherDesc'][0]['value'];
	var date = day_data['date'].split('-');
	var day = days[((new Date().getDay() + i) % 7)];
	var html = '<div class="day"' + i + '">\
								<div class="date">' + day + '</div>\
								<div class="icon ' + day_condition + '"\
								     title="' + day_description + '"></div>\
								<div class="high">' + day_data['tempMax' + temp] + '&deg;</div>\
								<div class="low">' + day_data['tempMin' + temp] + '&deg;</div>\
							</div>';
	return html;
}

function placesListItem(city_class, location) {
	var html = '<div class="place-list ' + city_class + '">\
							  <div class="delete"></div>' + location +
						 '</div>';
	return html;
}

function sizeOf(dictionary) {
	var count = 0;
	for (var key in dictionary) {
		if (dictionary.hasOwnProperty(key)) count++;
	}
	return count;
}

