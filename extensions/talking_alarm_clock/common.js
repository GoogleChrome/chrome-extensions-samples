/**
 * Copyright (c) 2011 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

var DEFAULT_A1_TT = '09:30';
var DEFAULT_A1_AMPM = 0;
var DEFAULT_A2_TT = '03:30';
var DEFAULT_A2_AMPM = 1;
var DEFAULT_RATE = 1.0;
var DEFAULT_VOLUME = 1.0;
var DEFAULT_PHRASE = 'It\'s $TIME, so get up!';
var DEFAULT_SOUND = 'ringing';

var audio = null;

var isPlaying = false;
var isSpeaking = false;
var isAnimating = false;

// Overridden in popup.js but not in background.js.
window.displayAlarmAnimation = function() {
};

// Overridden in popup.js but not in background.js.
window.stopAlarmAnimation = function() {
};

// Overridden in background.js but not in popup.js.
window.flashIcon = function() {
};

// Overridden in background.js but not in popup.js.
window.stopFlashingIcon = function() {
};

function $(id) {
  return document.getElementById(id);
}

function parseTime(timeString, ampm) {
  var time = timeString.match(/^(\d\d):(\d\d)$/);
  if (!time) {
    throw 'Cannot parse: ' + timeString;
  }

  var hours = parseInt(time[1], 10);
  if (hours == 12 && ampm == 0) {
    hours = 0;
  } else {
    hours += (hours < 12 && ampm == 1)? 12 : 0;
  }
  var minutes = parseInt(time[2], 10) || 0;

  return [hours, minutes];
}

function stopAll() {
  if (audio) {
    audio.pause();
    isPlaying = false;
  }
  try {
    chrome.tts.stop();
    isSpeaking = false;
  } catch (e) {
  }
  window.stopAlarmAnimation();
  window.stopFlashingIcon();
}

function playSound(duckAudio) {
  if (audio) {
    audio.pause();
    document.body.removeChild(audio);
    audio = null;
  }

  var currentSound = localStorage['sound'] || DEFAULT_SOUND;
  if (currentSound == 'none') {
    return;
  }

  audio = document.createElement('audio');
  audio.addEventListener('ended', function(evt) {
    isPlaying = false;
  });
  document.body.appendChild(audio);
  audio.autoplay = true;

  var src = 'audio/' + currentSound + '.ogg';
  var volume = parseFloat(localStorage['volume']) || DEFAULT_VOLUME;
  audio.volume = volume;
  audio.src = src;
  isPlaying = true;

  if (duckAudio) {
    for (var i = 0; i < 10; i++) {
      (function(i) {
         window.setTimeout(function() {
           var duckedVolume = volume * (1.0 - 0.07 * (i + 1));
           audio.volume = duckedVolume;
         }, 1800 + 50 * i);
      })(i);
    }
  }
}

function getTimeString(hh, mm) {
  var ampm = hh >= 12 ? 'P M' : 'A M';
  hh = (hh % 12);
  if (hh == 0)
    hh = 12;
  if (mm == 0)
    mm = 'o\'clock';
  else if (mm < 10)
    mm = 'O ' + mm;

  return hh + ' ' + mm + ' ' + ampm;
}

function speak(text) {
  var rate = parseFloat(localStorage['rate']) || DEFAULT_RATE;
  var pitch = 1.0;
  var volume = parseFloat(localStorage['volume']) || DEFAULT_VOLUME;
  var voice = localStorage['voice'];
  chrome.tts.speak(
      text,
      {voiceName: voice,
       rate: rate,
       pitch: pitch,
       volume: volume,
       onEvent: function(evt) {
         if (evt.type == 'end') {
           isSpeaking = false;
         }
       }
      });
}

function speakPhraseWithTimeString(timeString) {
  var phraseTemplate = localStorage['phrase'] || DEFAULT_PHRASE;
  var utterance = phraseTemplate.replace(/\$TIME/g, timeString);
  speak(utterance);
}

function speakPhraseWithCurrentTime() {
  var d = new Date();
  speakPhraseWithTimeString(getTimeString(d.getHours(), d.getMinutes()));
}

function ringAlarm(alarmHours, alarmMinutes) {
  window.displayAlarmAnimation();
  window.flashIcon();

  var phraseTemplate = localStorage['phrase'] || DEFAULT_PHRASE;
  var currentSound = localStorage['sound'] || DEFAULT_SOUND;

  if (phraseTemplate == '') {
    playSound(false);
  } else if (currentSound == 'none') {
    speakPhraseWithTimeString(getTimeString(alarmHours, alarmMinutes));
  } else {
    chrome.tts.stop();
    playSound(true);
    isSpeaking = true;
    window.setTimeout(function() {
      if (isSpeaking) {
        speakPhraseWithTimeString(getTimeString(alarmHours, alarmMinutes));
      }
    }, 2000);
  }
}

function ringAlarmWithCurrentTime() {
  var d = new Date();
  ringAlarm(d.getHours(), d.getMinutes());
}
