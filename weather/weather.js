/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/


/* TODO: Bugs to fix:
 * 
 * * Some formatter_address's are not formatted well for wether query
 *  * ie, search for dublin returns formatted_address: "Dublin, Co. Dublin, Ireland"
 *  and doing a weather search on that fails, so we dont add the city.

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
// consts

const num_dots_at_bottom = 4;
const base_weather_url = 'https://api.worldweatheronline.com/free/v1/weather.ashx?format=json&num_of_days=5&key=vfc3k7q22tjedr2rxse7xzke&q=';
const base_geolocation_url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=true&language=EN&latlng=';
const base_searchterm_url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=EN&address=';
// Samples:
// http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=kingston
// http://maps.googleapis.com/maps/api/geocode/json?sensor=true&latlng=43.480926,-80.53766399999999

const days = {
  0 : 'Sun',
  1 : 'Mon',
  2 : 'Tues',
  3 : 'Wed',
  4 : 'Thur',
  5 : 'Fri',
  6 : 'Sat'
};

const condition_codes = {
  113 : 'sunny',
  116 : 'partly-cloudy',
  119 : 'cloudy',
  122 : 'cloudy',
  143 : 'mostly-sunny',
  176 : 'scattered-light-rain',
  179 : 'light-snow',
  182 : 'rain-snow',
  185 : 'rain-snow',
  200 : 'tstorm',
  227 : 'snow',
  230 : 'snow',
  248 : 'cloudy',
  260 : 'cloudy',
  263 : 'scattered-light-rain',
  266 : 'light-rain',
  281 : 'rain-snow',
  284 : 'rain-snow',
  293 : 'scattered-light-rain',
  296 : 'light-rain',
  299 : 'light-rain',
  302 : 'rain',
  305 : 'rain',
  308 : 'rain',
  311 : 'rain',
  314 : 'hail',
  317 : 'rain-snow',
  320 : 'rain-snow',
  323 : 'light-snow',
  326 : 'light-snow',
  329 : 'scattered-snow',
  332 : 'snow',
  335 : 'scattered-snow',
  338 : 'snow',
  350 : 'hail',
  353 : 'light-rain',
  356 : 'rain',
  359 : 'rain',
  362 : 'rain-snow',
  365 : 'rain-snow',
  368 : 'light-snow',
  371 : 'snow',
  374 : 'hail',
  377 : 'hail',
  386 : 'scattered-light-rain',
  389 : 'rain',
  392 : 'light-snow',
  395 : 'snow',
};

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
// "model"

function City(address) {
  // TODO: this doesn't really need to be a member, can just be a method, and then we don't need to worry about changing id format & sync issues
  this.id = City.ConvertAddressDomFriendly(address);
  this.address = address;
  this.date = new Date();
}

City.ConvertAddressDomFriendly = function(address) {
  // TODO: improve this
  if (!address)
    return;
  return address.toLowerCase().replace(/,/g , "-").split(' ').join('-');
}

function Cities() {
  this.cities = [];
  this.version = Cities.CurrentVersion;
}

Cities.CurrentVersion = 2;

Cities.prototype.sync = function() {
  this.cities.forEach(function(city) {
    city.date = city.date.toJSON();
  });
  chrome.storage.sync.set({ 'cities': this });
  this.cities.forEach(function(city) {
    city.date = new Date(city.date);
  });
}

Cities.prototype.add = function(city) {
  this.cities.push(city);
  this.sync();
}

Cities.prototype.remove = function(city) {
  this.cities.splice(this.cities.indexOf(city), 1);
  this.sync();
}

Cities.prototype.length = function() {
  return this.cities.length;
}

Cities.prototype.findByKey = function(key, value) {
  for (var i = 0; i < this.cities.length; ++i) {
    var city = this.cities[i];
    if (city[key] === value)
      return city;
  }
  return null;
}

Cities.prototype.findById = function(value) {
  return this.findByKey("id", value);
}

Cities.prototype.sortedByKey = function(key) {
  return this.cities.slice(0).sort(function(a,b){
    var ret = (typeof a[key] === 'string') ? a[key].localeCompare(b[key]) : a[key] - b[key];
    return ret;
  });
}

Cities.prototype.ordered = function() {
  return this.sortedByKey('date');
}

Cities.prototype.asArray = function(key) {
  return this.cities;
}

function WeatherData(city, current_condition, forecast) {
  this.city = city;
  this.current_condition = current_condition;
  this.forecast = forecast;
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
// globals

var temp = 'F';
var cities = null;
var current_city = null;
var weather_data = {}; // map city.id->WeatherData
var myScroll = null;

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
// "controller"

function selectCity(city) {
  if (!city)
    return;
  current_city = city.id;

  $('.forecast').removeClass('selected');
  $('.dot').removeClass('selected');
  $('.forecast[city=' + city.id + ']').addClass('selected');
  $('.dot[city=' + city.id + ']').addClass('selected');

  refreshIScroll();
  var index = cities.ordered().indexOf(getCurrentCity());
  if (myScroll && myScroll.currPageX != index)
    myScroll.scrollToPage(index);

  setDots();
}

function deleteCity(city) {
  if (!city)
    return;
  $('[city=' + city.id +']').remove();
  delete weather_data[city.id];
  cities.remove(city);
  selectCity(getCurrentCity()); // in case we removed the previously selected city
}

function addCity(address) {
  var id = City.ConvertAddressDomFriendly(address);
  var city = cities.findById(id);
  if (city != null)
    return city;
  city = new City(address);
  cities.add(city);
  return city;
}

function getCurrentCity() {
  // TODO: do we need to use current_city global for this?  Can we just walk the DOM?
  // we set the city we want to be current, before we add it to the dom?
  var city = cities.findById(current_city);
  if (!city && cities.length() > 0)
    city = cities.asArray()[0];
  return city;
}

function addWeatherData(city, current_condition, forecast) {
  weather_data[city.id] = new WeatherData(city, current_condition, forecast);
  refresh();
}

function currentlyOnSettingsPage() {
  return !$('#settings').hasClass('hidden');
}

function refreshIScroll() {
  if (!myScroll)
    return;
  setTimeout(function() {
    myScroll.refresh();
  }, 0);
}

function hideLoading() {
  if ($('#loading').hasClass('fadeOut')) {
    return;
  }
  $('#loading').css('opacity', 0);
  setTimeout(function() {
    $('#loading').addClass('hidden');
  }, 500); // 500 comes from the fade out time in css
}

function hideSettings() {
  $('#weather').removeClass('hidden');
  $('#settings').addClass('hidden');
  $('#dots').removeClass('hidden');
  $('#searchterm').val('');
  hideInputError();
  selectCity(getCurrentCity());
}

function showSettings() {
  $('#weather').addClass('hidden');
  $('#settings').removeClass('hidden');
  $('#dots').addClass('hidden');
  $('#searchterm').focus();
  hideInputError();
}

function showInputError(searchterm) {
  $('#searchterm').addClass('form-error');
  $('#new #error-message').text('Could not find weather for \'' + searchterm + '\'');
  $('#new #error-message').removeClass('hidden');
}

function hideInputError() {
  $('#searchterm').removeClass('form-error');
  $('#searchterm').val('');
  $('#new #error-message').addClass('hidden');
  $('#new').removeClass('selected');
}

function adjustnext(n) {
  var c = cities.ordered();
  var index = c.indexOf(getCurrentCity());
  var newCity = c[Math.min(c.length-1, index+n)];
  selectCity(newCity);
}

function adjustprev(n) {
  var c = cities.ordered();
  var index = c.indexOf(getCurrentCity());
  var newCity = c[Math.max(0, index-n)];
  selectCity(newCity);
}

function attemptAddCity(searchurl, onsuccess, onerror) {
  // TODO: figure out how to resolve conflicts when multiple cities returned
  // Idea: seems to be duplication at the google api level, so maybe create a set of unique canonical id's, and then ask user to resolve?
  $.get(searchurl, function(data) {
    var formatted_address = null;
    for (var i = 0; i < data.results.length; i++) {
      if (data.results[i].types.indexOf('locality') != -1 || data.results[i].types.indexOf('administrative_area_level_1') != -1) {
        formatted_address = data.results[i].formatted_address;
        break;
      }
    }

    if (!formatted_address) {
      onerror && onerror();
      return;
    }

    getWeatherData(formatted_address, function(current_condition, forecast) {
      var city = addCity(formatted_address);
      addWeatherData(city, current_condition, forecast);
      onsuccess && onsuccess(city);
    }, onerror);
  }, 'json');
}

function getWeatherData(address, onsuccess, onerror) {
  var url = encodeURI(base_weather_url + address);
  $.get(url, function(data) {
    if (!data.data.error) {
      var current_condition = data.data.current_condition[0];
      var forecast = data.data.weather;
      onsuccess && onsuccess(current_condition, forecast);
    } else {
      onerror && onerror();
    }
  }, 'json');
};

function updateAllWeatherData(onfirstsuccessfulupdate) {
  cities.asArray().forEach(function(city) {
    getWeatherData(city.address,
      function(current_condition, forecast) {
        addWeatherData(city, current_condition, forecast);
        onfirstsuccessfulupdate && onfirstsuccessfulupdate();
      }, null); // TODO: handle error?
  });
}

function attemptAddCurrentLocation() {
  // TODO: we always permanentally add your current location.  Should keep a history of all places, but only display "pinned" places
  // and the current location
  var onfail = function(reason) {
    console.warn(reason);
    if (cities.length() != 0) {
      return;
    }
    showSettings();
    hideLoading();
  };
  navigator.geolocation.getCurrentPosition(
    function(position) {
      var searchurl = base_geolocation_url + position.coords.latitude + ',' + position.coords.longitude;
      attemptAddCity(searchurl,
        function(city) {
          selectCity(city);
          hideLoading();
        },
        onfail.bind(null, "Could not find current location")
      );
    },
    onfail.bind(null, "Geocoder failed")
  );
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
// "view"

function refresh() {
  cities.sortedByKey('date').forEach(function(city) {
    if (weather_data.hasOwnProperty(city.id)) {
      var w = weather_data[city.id];
      updateCityDisplay(city, w.current_condition, w.forecast);
    }
  });
  refreshIScroll();
}

function updateCityDisplay(city, current_condition, forecast) {
  // remove old city elements
  $('[city=' + city.id + ']').remove();

  var forecast_div = document.createElement('div');
  var description = condition_codes[current_condition.weatherCode];
  forecast_div.className = 'forecast ' + description;
  forecast_div.setAttribute('city', city.id);
  $('#weather').append(forecast_div);

  forecast_div.appendChild(currentDisplay(current_condition));

  var tempMax = forecast[0]['tempMax' + temp];
  var tempMin = forecast[0]['tempMin' + temp];
  var high_low_div = document.createElement('div');
  high_low_div.className = 'high_low';
  high_low_div.appendChild(document.createTextNode(tempMax + '\u00B0 / ' + tempMin + '\u00B0')); // &deg;
  forecast_div.appendChild(high_low_div);

  var city_div = document.createElement('div');
  city_div.className = 'city';
  city_div.appendChild(document.createTextNode(city.address));
  forecast_div.appendChild(city_div);

  /*
  var day_html = '';
  forecast.splice(1,4).forEach(function(forecast_day, i) {
    day_html += dayDisplay(forecast_day, i);
  });
  $(forecast_div).append(day_html);
  */

  var city_list_div = document.createElement('div');
  city_list_div.className = 'city-list';
  city_list_div.setAttribute('city', city.id);
  var delete_div = document.createElement('div');
  delete_div.className = 'delete';
  city_list_div.appendChild(delete_div);
  city_list_div.appendChild(document.createTextNode(city.address));
  $('#settings #cities-list').append(city_list_div);

  var dot = document.createElement('div');
  dot.className = 'dot';
  dot.setAttribute('city', city.id);
  dot.setAttribute('title', city.id);
  $('#dots #next').before(dot);

  // TODO: find a way to remove the need for this
  if (city === getCurrentCity()) {
    selectCity(city);
  }

  setDots();

  // TODO
  // What follows is a workaround for broken jquery "live" onclick functionality on mobile.
  // Need to 'poke' elements so they are clickable.
  Array.prototype.forEach.call(document.querySelectorAll('#dots .dot'), function(e,i) {
    e.onclick = function(){};
  });
  Array.prototype.forEach.call(document.querySelectorAll('.city-list .delete'), function(e,i) {
    e.onclick = function(){};
  });
}

function setDots() {
  if (cities.length() <= num_dots_at_bottom) {
    $('.dot').addClass('shown');
    $('#dots #prev').removeClass('disabled').removeClass('shown');
    $('#dots #next').removeClass('disabled').removeClass('shown');
  } else {
    $('.dot').removeClass('shown');

    var c = cities.ordered();
    var index = c.indexOf(getCurrentCity());
    var i = index % num_dots_at_bottom;
    var first = index - i;
    for (var l = first; l < first + num_dots_at_bottom && l < c.length; l++)
      $('#dots .dot[city=' + c[l].id + ']').addClass('shown');

    if (first === 0)
      $('#dots #prev').removeClass('shown').addClass('disabled');
    else
      $('#dots #prev').addClass('shown').removeClass('disabled');

    if ((first + num_dots_at_bottom) >= c.length)
      $('#dots #next').removeClass('shown').addClass('disabled');
    else
      $('#dots #next').addClass('shown').removeClass('disabled');

  }
}

function currentDisplay(current_condition) {
  var current_temp = current_condition['temp_' + temp];
  var current_description = current_condition.weatherDesc[0].value;
  var current_icon = condition_codes[current_condition.weatherCode];
  var current_div = document.createElement('div');
  current_div.className = 'current';
  var current_temp_div = document.createElement('div');
  current_temp_div.className = 'current-temp';
  current_temp_div.appendChild(document.createTextNode(current_temp));
  var current_icon_div = document.createElement('div');
  current_icon_div.className = 'current-icon ' + current_icon;
  current_icon_div.setAttribute('title', current_description);
  current_div.appendChild(current_temp_div);
  current_div.appendChild(current_icon_div);
  return current_div;
}

function dayDisplay(forecast_day, i) {
  var day_condition = condition_codes[forecast_day.weatherCode];
  var day_description = forecast_day.weatherDesc[0].value;
  var date = forecast_day.date.split('-');
  var day = days[((new Date().getDay() + i) % 7)];
  var html = '<div class="day' + i + '">' +
                '<div class="date">' + day + '</div>' +
                '<div class="icon ' + day_condition + '"' +
                    ' title="' + day_description + '"></div>' +
                '<div class="high">' + forecast_day['tempMax' + temp] + '&deg;</div>' +
                '<div class="low">' + forecast_day['tempMin' + temp] + '&deg;</div>' +
              '</div>';
  return html;
}

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
// init

function initHandlers() {
  $('#close').click(function() {
    window.close();
  });

  $('input[name="temp-type"]').change(function() {
    // TODO: this is firing twice per change!
    temp = $('input[name="temp-type"]:checked').val();
    chrome.storage.sync.set({ 'temp' : temp });
    updateAllWeatherData();
  });

  // TODO: remove the use of jQuery live()
  $('#dots .dot').live('click', function() {
    var id = this.getAttribute('city');
    selectCity(cities.findById(id));
  });

  $('.delete').live('click', function() {
    var id = this.parentElement.getAttribute('city');
    deleteCity(cities.findById(id));
  });

  $('#new #add').click(function() {
    var searchterm = $('#searchterm').val();
    var searchurl = base_searchterm_url + searchterm;
    // TODO: this will call onerror asyncronously -- should disable textbox during that time?
    attemptAddCity(searchurl,
      function(city) {
        hideInputError();
        selectCity(city);
      }, showInputError.bind(null, searchterm));
  });

  $('#searchterm').keyup(function(e) {
    if (event.which == 13) // enter
      $('#new #add').click();
    if (event.which == 27) // esc
      $('#new #cancel').click();
  });

  $('#new #cancel').click(function() {
    hideSettings();
  });

  $('#settingsToggle').click(function() {
    if (currentlyOnSettingsPage())
      hideSettings();
    else
      showSettings();
  });


  $('#dots #next.shown').live('click', function() {
    adjustnext(num_dots_at_bottom);
  });

  $('#dots #prev.shown').live('click', function() {
    adjustprev(num_dots_at_bottom);
  });

  $(document).keyup(function(event) {
    if (currentlyOnSettingsPage())
      return;
    if (event.which == 39) // right-arrow
      adjustnext(1);
    else if (event.which == 37) // left-arrow
      adjustprev(1);
  });

  // disable page scrolling only on main page
  document.ontouchmove = function(e) {
    if (!currentlyOnSettingsPage())
      e.preventDefault();
  };

  document.addEventListener("backbutton" , function(e) {
    if (currentlyOnSettingsPage())
      hideSettings();
    else
      window.navigator.app.exitApp();
  }, false);
}

function init() {
  $(document.body).addClass((window.cordova !== undefined) ? 'mobile' : 'not-mobile');

  chrome.storage.sync.get(function(items) {
    if (items.cities !== undefined && items.cities.version === Cities.CurrentVersion) {
      cities = items.cities;
      cities.__proto__ = Cities.prototype;
      cities.asArray().forEach(function(city) {
        city.__proto__ = City.prototype;
        city.date = new Date(city.date);
      });
    } else {
      cities = new Cities();
    }
    temp = items.temp;
    if (!temp) temp = 'F';
    $('input[name="temp-type"].' + temp).attr('checked', true);
    updateAllWeatherData(function() {
      setTimeout(hideLoading, 300); // 300ms comes from the amount of time we want to give other cities to load weather
    });
  });

  attemptAddCurrentLocation();

  initHandlers();

  setInterval(function() {
    updateAllWeatherData();
  }, 1000 * 60 * 5);

  myScroll = new iScroll('wrapper', {
    snap: true,
    bounce: true,
    momentum: false,
    hScroll: true,
    vScroll: false,
    hScrollbar: false,
    vScrollbar: false,
    onScrollEnd: function () {
      var city = cities.ordered()[this.currPageX];
      selectCity(city);
    },
    onTouchEnd: function () {
      var city = cities.ordered()[this.currPageX];
      selectCity(city);
    }
  });
}

$(document).ready(function() {
  if (typeof cordova !== 'undefined') {
    document.addEventListener("deviceready", init);
  } else {
    init();
  }
});

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/
