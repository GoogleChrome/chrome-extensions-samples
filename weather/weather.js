/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var temp = 'F';
var places = {};
var locations = [];
var current_place = '';
var base_weather_url = 'http://free.worldweatheronline.com/feed/weather.ashx?format=json&num_of_days=5&key=78b33b52eb213218120708&q=';
var base_city_url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&latlng=';
var settings = false;

var days = {0 : 'Sunday',
						1 : 'Monday',
						2 : 'Tuesday',
						3 : 'Wednesday',
						4 : 'Thursday',
						5 : 'Friday',
						6 : 'Saturday'};

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
											};

/**
 * Called when the document (weather.html) has loaded
 * and the DOM is ready for interactions
 */
$(document).ready(function() {

	// Uses the Chrome Storage API to get the
	// the cities the user has chosen and whether
	// they have chosen for their temperatures
	// to be shown in Celsius or Farenheit
	//
	// @see http://developer.chrome.com/trunk/apps/storage.html
	chrome.storage.sync.get(function(items) {
		for (var place_class in items['places']) {
			places[place_class] = items['places'][place_class];
		}
		temp = items['temp'];
		if (!temp) temp = 'F';
		$('input[name="temp-type"].' + temp).attr('checked', true);
		setup();
  });

  $('.close').click(function() {
    window.close();
  });

	// Tracks to changes to the temperature
	// format. Stores the setting for the user
	//
	// @see http://developer.chrome.com/trunk/apps/storage.html
  $('input[name="temp-type"]').change(function() {
		temp = $('input[name="temp-type"]:checked').val();
		chrome.storage.sync.set({ 'temp' : temp });
		refresh();
  });

  // shows a specific place
	$('#places .place').live('click', function() {
		$('#weather').removeClass('hidden');
		$('#info-text').addClass('hidden');
		$('#new-city').val('');
		$('.new').removeClass('selected');
		$('input#new-city').removeClass('form-error');
		$('.new .error-message').addClass('hidden');
		var city_class = $(this).attr('class').split(' ')[1];
		$('.location').removeClass('selected');
		$('.place').removeClass('selected');
		$('.' + city_class).addClass('selected');
		current_place = city_class;
		$('#new-city').val('');
	});

	// deletes a place and updates the stored
	// places for the current user
	//
	// @see http://developer.chrome.com/trunk/apps/storage.html
	$('.delete').live('click', function() {
		var city_class = $(this).parent().attr('class').split(' ')[1];
		$('.' + city_class).remove();
		delete places[city_class];
		var index = locations.indexOf(city_class);
		locations.splice(index, 1);
		if (sizeOf(places) === 0) {
			current_place = 'new';
		}
		else {
			if (index === 0)
				current_place = locations[0];
			else
				current_place = locations[index - 1];
		}
		$('.' + current_place).addClass('selected');
		chrome.storage.sync.set({ 'places': places });
		setDots();
	});

	// gets the location that the user
	// has typed in and creates a view for it
	$('.new .add').click(function() {
		var location = $('#new-city').val();
		current_place = location.toLowerCase().split(', ')[0].split(' ').join('-');
		if (!(current_place in places)) {
			var new_place = {};
			new_place[current_place] = location;
			createDisplay(new_place, true);
		} else {
			$('#new-city').val('');
			$('.location').removeClass('selected');
			$('.place').removeClass('selected');
			$('.location.' + current_place).addClass('selected');
			$('#weather').removeClass('hidden');
			$('#info-text').addClass('hidden');
		}
	});

	// shortcut handler for tracking the
	// return key and calling the click handler
	$('#new-city').keyup(function(event) {
		if (event.which == 13)
			$('.new .add').click();
	});

	// shortcut handler for switching to next city
	$(document).keyup(function(event) {
		if (event.which == 39)
			var index = locations.indexOf(current_place);
			if (index < locations.length - 1) {
				$('.' + current_place).removeClass('selected');
				current_place = locations[index + 1];
				$('.' + current_place).addClass('selected');
				setDots();
			}
	});

	$('#places #next.shown').live('click', function() {
		var index = locations.indexOf(current_place);
		$('.' + current_place).removeClass('selected');
		if (index + 4 < locations.length)
			current_place = locations[index + 4];
		else
			current_place = locations[locations.length - 1];
		$('.' + current_place).addClass('selected');
		setDots();
	});

	// shortcut handler for switching to previous city
	$(document).keyup(function(event) {
		if (event.which == 37)
			var index = locations.indexOf(current_place);
			if (index > 0) {
				$('.' + current_place).removeClass('selected');
				current_place = locations[index - 1];
				$('.' + current_place).addClass('selected');
				setDots();
			}
	});

	$('#places #prev.shown').live('click', function() {
		var index = locations.indexOf(current_place);
		$('.' + current_place).removeClass('selected');
		if (index - 4 >= 0)
			current_place = locations[index - 4];
		else
			current_place = locations[0];
		$('.' + current_place).addClass('selected');
		setDots();
	});

	// cancels the city addition
	$('.new .cancel').click(function() {
		$('#new-city').val('');
		$('.new').removeClass('selected');
		$('input#new-city').removeClass('form-error');
		$('.new .error-message').addClass('hidden');
		var city_class = current_place.split(', ')[0].split(' ').join('-');
		$('.' + city_class).addClass('selected');
		$('#info-text').addClass('hidden');
		$('#weather').removeClass('hidden');
	});

	// switches the weather and info views
	$('#info').click(function() {
		if (settings && locations.length > 0) {
			settings = false;
			$('.new .cancel').click();
		} else {
			settings = true;
			$('#weather').addClass('hidden');
			$('#info-text').removeClass('hidden');
			$('#new-city').focus();
		}
	});

});

/**
 * Geolocates the user to get their current position. Note
 * that this does not require user interaction, but is
 * required as a permission in the manifest
 *
 * @see http://developer.chrome.com/trunk/apps/manifest.html#permissions
 */
function setup() {
	navigator.geolocation.getCurrentPosition(getCurrentPosSuccessFunction,
																					getCurrentPosErrorFunction);
}

/**
 * Removes all the markup and recreates
 */
function refresh() {
	for (var location_class in places) {
		$('.' + location_class).remove();
	}
	createDisplay(places);
}

/**
 * Callback for the successful geolocation request.
 * Expands on the latitude / longitude pairs
 *
 * @param {Object} position The geolocation position passed by the browser
 * @see http://www.w3.org/TR/geolocation-API/#position_interface
 */
function getCurrentPosSuccessFunction(position) {

  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var url = base_city_url + lat + ',' + lng;

  $.get(url,
		function(data) {

			for (var i = 0; i < data['results'].length; i++) {

				var component_types = data['results'][i]['types'];

				if ( (component_types.indexOf('street_address') != -1) ||
						(component_types.indexOf('locality') != -1) ) {

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
					if (!(current_place in places)) {
						places[current_place] = location;
					}
					break;
				}
			}
			createDisplay(places);
		},
		'json'
	);
}

/**
 * Callback for when geolocation fails.
 * Sends the user through to the place locator
 *
 * @param {Object} error The browser's geolocation error
 * @see http://www.w3.org/TR/geolocation-API/#position_error_interface
 */
function getCurrentPosErrorFunction(error) {
  console.log("Geocoder failed");
	for (var place in places) {
		current_place = places[place];
		break;
  }
	if (current_place === '') {
		current_place = 'new';
		$('#info-text').removeClass('hidden');
	}
}

/**
 * Takes the list of locations and looks up
 * the weather data for them. It also stores
 * the collection of places stored in the Chrome
 * storage for those places
 *
 * @see http://developer.chrome.com/trunk/apps/storage.html
 */
function createDisplay(locations, add) {

	for (var location_class in locations) {

		var location = locations[location_class];
		var url = encodeURI(base_weather_url + location);

		$.get(url,

			function(data) {

				// check for errors loading the data for that city
				if (!data['data']['error']) {

					var current_condition = data['data']['current_condition'][0];
					var weather = data['data']['weather'];
					var city = data['data']['request'][0]['query'];
					location_class = city.toLowerCase().split(', ')[0].split(' ').join('-');

					addLocationDisplay(city, current_condition, weather);

					// if this is to be added
					// to the stored locations do that now
					if (add) {
						current_place = location_class;
						$('input#new-city').removeClass('form-error');
						$('input#new-city').val('');
						$('.new .error-message').addClass('hidden');
						$('.new').removeClass('selected');
						places[location_class] = city;
						chrome.storage.sync.set({ 'places': places });
						$('.location').removeClass('selected');
						$('.place').removeClass('selected');
						$('.location.' + location_class).addClass('selected');
						$('.place.' + location_class).addClass('selected');
						$('#weather').removeClass('hidden');
						$('#info-text').addClass('hidden');
					}
				}
				else if (add) {

					// complain if they tried to add a non-existent city
					$('input#new-city').addClass('form-error');
					$('.new .error-message').text('Could not find weather for ' + location);
					$('.new .error-message').removeClass('hidden');
				}
			},
			'json'
		);
	}
}

/**
 * Sets the display of dots at the bottom of the screen
 */
function setDots() {
	if (locations.length < 5) {
		$('.place').addClass('shown');
		$('#places #prev').removeClass('disabled').removeClass('shown');
		$('#places #next').removeClass('disabled').removeClass('shown');
	}
	else {
		$('#places #prev').addClass('disabled');
		$('#places #next').addClass('disabled');
		$('.place').removeClass('shown');
		var index = locations.indexOf(current_place);
		if (index >= 4)
			$('#places #prev').addClass('shown').removeClass('disabled');
		else
			$('#places #prev').removeClass('shown').addClass('disabled');
		if (index < locations.length - 4) {
			$('#places #next').addClass('shown').removeClass('disabled');
			var i = index % 4;
			var first = index - i;
		}
		else {
			$('#places #next').removeClass('shown').addClass('disabled');
			var first = locations.length - 4;
		}
		for (var l = first; l < first + 4; l++)
			$('#places .place.' + locations[l]).addClass('shown');

	}
}

/**
 * Creates the markup for the city and adds the specific
 * values for the weather conditions, then adds
 * it to the weather view.
 *
 * @param {String} location The long name of the city
 * @param {Object} current_condition The current weather conditions
 * @param {Array} weather The 5-day weather forecast for the city
 */
function addLocationDisplay(location, current_condition, weather) {

	var city_class = location.toLowerCase().split(', ')[0].split(' ').join('-');
	locations.push(city_class);
	var selected = '';

	if (city_class == current_place) {
		selected = ' selected';
	}

	// create the markup
	var description = ' ' + condition_codes[current_condition['weatherCode']];
	var location_html = '<div class="location ' + city_class + description + selected + '">' +
											'</div>';
	var city = location.split(', ')[0];
	var location_dot_html = '<div class="place ' + city_class + selected + '"' +
													'title="' + city + '"></div>';
	var city_html = cityDisplay(location);
	var places_list_html = placesListItem(city_class, city);
	var current_html = currentDisplay(current_condition);
	var high_low = '<div class="high_low">' +
										weather[0]['tempMax' + temp] + '&deg; / ' +
										weather[0]['tempMin' + temp] + '&deg;' +
								 '</div>';
	var day_html = '';

	for (var i = 0; i < weather.length; i++) {
		day_html += dayDisplay(weather, i);
	}

	// update the UI
	$('#info-text .places-list').append(places_list_html);
	$('#weather').append(location_html);
	$('#weather .' + city_class).append(current_html);
	$('#weather .' + city_class).append(high_low);
	$('#weather .' + city_class).append(city_html);
	$('#places #next').before(location_dot_html);

	setDots();
}

/**
 * Helper to wrap the city name in markup
 *
 * @param {String} location The long name of the city
 */
function cityDisplay(location) {
	var city = location.split(', ')[0];
  var html = '<div class="city">' + city.toUpperCase() + '</div>';
  return html;
}

/**
 * Helper to wrap the current weather conditions
 * in the appropriate markup
 *
 * @param {Object} current_condition The current weather conditions
 */
function currentDisplay(current_condition) {

	var current_temp = current_condition['temp_' + temp];
	var current_description = current_condition['weatherDesc'][0]['value'];
	var current_icon = condition_codes[current_condition['weatherCode']];
	var html = '<div class="current">' +
								'<div class="current-temp">' + current_temp + '</div>' +
								'<div class="current-icon ' + current_icon + '"' +
									' title="' + current_description + '"></div>' +
							'</div>';
	return html;

}

/**
 * Helper to wrap the weather for a specific day
 * in the appropriate markup
 *
 * @param {Array} weather The weather forecast, one object per day
 * @param {Number} i The index from the weather forecast array to wrap
 */
function dayDisplay(weather, i) {
	var day_data = weather[i];
	var day_condition = condition_codes[day_data['weatherCode']];
	var day_description = day_data['weatherDesc'][0]['value'];
	var date = day_data['date'].split('-');
	var day = days[((new Date().getDay() + i) % 7)];
	var html = '<div class="day"' + i + '">' +
								'<div class="date">' + day + '</div>' +
								'<div class="icon ' + day_condition + '"' +
										' title="' + day_description + '"></div>' +
								'<div class="high">' + day_data['tempMax' + temp] + '&deg;</div>' +
								'<div class="low">' + day_data['tempMin' + temp] + '&deg;</div>' +
							'</div>';
	return html;
}

/**
 * Helper to wrap a location in a div
 * with a specific class
 *
 * @param {String} city_class The class to wrap the location name
 * @param {String} location The location name to wrap
 */
function placesListItem(city_class, location) {
	var html = '<div class="place-list ' + city_class + '">' +
								'<div class="delete"></div>' + location +
							'</div>';
	return html;
}

/**
 * Utility function to calculate the actual size
 * of an object in terms of the properties it contains
 *
 * @param {Object} dictionary The object to count
 */
function sizeOf(dictionary) {
	var count = 0;
	for (var key in dictionary) {
		if (dictionary.hasOwnProperty(key)) count++;
	}
	return count;
}
