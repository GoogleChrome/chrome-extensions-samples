/**
 * Copyright (c) 2011 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

var a1Timer = null;
var a2Timer = null;
var port = null;
var iconFlashTimer = null;

var HOUR_MS = 1000 * 60 * 60;

// Override from common.js
window.stopFlashingIcon = function() {
  window.clearTimeout(iconFlashTimer);
  chrome.browserAction.setIcon({'path': 'clock-19.png'});
};

// Override from common.js
window.flashIcon = function() {
  var flashes = 10;
  function flash() {
    if (flashes == 0) {
      stopFlashingIcon();
      return;
    }

    if (flashes % 2 == 0) {
      chrome.browserAction.setIcon({'path': 'clock-highlighted-19.png'});
    } else {
      chrome.browserAction.setIcon({'path': 'clock-19.png'});
    }
    flashes--;
    iconFlashTimer = window.setTimeout(flash, 500);
  }
  flash();
};

function setTimer(alarmHours, alarmMinutes) {
  var alarmTime = (alarmHours * 60 + alarmMinutes) * 60 * 1000;
  var d = new Date();
  var now = d.getHours() * HOUR_MS +
            d.getMinutes() * 60 * 1000 +
            d.getSeconds() * 1000;
  var delta = (alarmTime - now);

  if (delta >= -5000 && delta < 1000) {
    ringAlarm(alarmHours, alarmMinutes);
    if (port) {
      port.postMessage({'cmd': 'anim'});
    }
    return null;
  }

  if (delta < 0) {
    delta += HOUR_MS * 24;
  }
  if (delta >= 1000) {
    if (delta > HOUR_MS) {
      delta = HOUR_MS;
    }
    console.log('Timer set for ' + delta + ' ms');
    return window.setTimeout(resetTimers, delta);
  }

  return null;
};

function resetTimers() {
  if (a1Timer) {
    window.clearTimeout(a1Timer);
  }

  try {
    var a1_on = (localStorage['a1_on'] == 'true');
    var a1_tt = localStorage['a1_tt'] || DEFAULT_A1_TT;
    var a1_ampm = localStorage['a1_ampm'] || DEFAULT_A1_AMPM;
    if (a1_on) {
      var alarmHoursMinutes = parseTime(a1_tt, a1_ampm);
      var alarmHours = alarmHoursMinutes[0];
      var alarmMinutes = alarmHoursMinutes[1];
      a1Timer = setTimer(alarmHours, alarmMinutes);
    }
  } catch (e) {
    console.log(e);
  }

  try {
    var a2_on = (localStorage['a2_on'] == 'true');
    var a2_tt = localStorage['a2_tt'] || DEFAULT_A2_TT;
    var a2_ampm = localStorage['a2_ampm'] || DEFAULT_A2_AMPM;
    if (a2_on) {
      var alarmHoursMinutes = parseTime(a2_tt, a2_ampm);
      var alarmHours = alarmHoursMinutes[0];
      var alarmMinutes = alarmHoursMinutes[1];
      a2Timer = setTimer(alarmHours, alarmMinutes);
    }
  } catch (e) {
    console.log(e);
  }

  if (a1_on || a2_on) {
    chrome.browserAction.setIcon({'path': 'clock-19.png'});
  } else {
    chrome.browserAction.setIcon({'path': 'clock-disabled-19.png'});
  }
}

function onLocalStorageChange() {
  resetTimers();
}

function initBackground() {
  window.addEventListener('storage', onLocalStorageChange, false);

  chrome.runtime.onConnect.addListener(function(popupPort) {
    port = popupPort;
    port.onDisconnect.addListener(function() {
      port = null;
    });
  });
}

initBackground();
resetTimers();
