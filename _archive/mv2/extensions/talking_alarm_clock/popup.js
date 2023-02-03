// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var blankClockImage;
var blankClockAnim1Image;
var blankClockAnim2Image;
var animationTimer;
var currentClockImage;
var port;

function updateEnabledStatus(alarm) {
  var enabled = $('a' + alarm + '_on').checked;
  $('a' + alarm + '_tt').disabled = !enabled;
  $('a' + alarm + '_ampm').disabled = !enabled;
  var valid = true;
  try {
    var tt = $('a' + alarm + '_tt').value;
    var ampm = $('a' + alarm + '_ampm').selectedIndex;
    parseTime(tt, ampm);
  } catch (x) {
    valid = false;
  }
  if (valid) {
    $('a' + alarm + '_wrap').removeAttribute('aria-invalid');
  } else {
    $('a' + alarm + '_wrap').setAttribute('aria-invalid', 'true');
  }
  if (enabled) {
    $('a' + alarm + '_wrap').classList.remove('disabled');
  } else {
    $('a' + alarm + '_wrap').classList.add('disabled');
  }
}

function loadAllImages() {
  var loadCount = 0;
  var img = new Image();
  img.onload = function() {
    blankClockImage = img;
    currentClockImage = blankClockImage;
    drawClock();
  };
  img.src = 'blank-clock-150.png';

  // These will finish loading before they're needed, no need
  // for an onload handler.
  blankClockAnim1Image = new Image();
  blankClockAnim1Image.src = 'blank-clock-ring1-150.png';
  blankClockAnim2Image = new Image();
  blankClockAnim2Image.src = 'blank-clock-ring2-150.png';
}

function drawClock(hh, mm, ss) {
  if (hh == undefined || mm == undefined) {
    var d = new Date();
    hh = d.getHours();
    mm = d.getMinutes();
    ss = d.getSeconds() + 0.001 * d.getMilliseconds();
  }

  if (!currentClockImage) {
    loadAllImages();
    return;
  }

  var ctx = $('clock').getContext('2d');
  ctx.drawImage(currentClockImage, 0, 0);

  // Move the hour by the fraction of the minute
  hh = (hh % 12) + (mm / 60);

  // Move the minute by the fraction of the second
  mm += (ss / 60);

  var hourAngle = Math.PI * hh / 6;
  var hourX = Math.sin(hourAngle);
  var hourY = -Math.cos(hourAngle);
  var minAngle = Math.PI * mm / 30;
  var minX = Math.sin(minAngle);
  var minY = -Math.cos(minAngle);
  var secAngle = Math.PI * ss / 30;
  var secX = Math.sin(secAngle);
  var secY = -Math.cos(secAngle);

  var cx = 75;
  var cy = 77;

  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - 4 * hourX, cy - 4 * hourY);
  ctx.lineTo(cx + 20 * hourX, cy + 20 * hourY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 8 * minX, cy - 8 * minY);
  ctx.lineTo(cx + 35 * minX, cy + 33 * minY);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#696969';
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.moveTo(cx - 4 * hourX, cy - 4 * hourY);
  ctx.lineTo(cx + 20 * hourX, cy + 20 * hourY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 8 * minX, cy - 8 * minY);
  ctx.lineTo(cx + 35 * minX, cy + 33 * minY);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = '#990000';
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.moveTo(cx - 4 * secX, cy - 4 * secY);
  ctx.lineTo(cx + 40 * secX, cy + 40 * secY);
  ctx.stroke();
}

function updateCurrentTime() {
  var now = new Date();
  var hh = now.getHours();
  var mm = now.getMinutes();
  var ss = now.getSeconds();
  var str = '';
  if (hh % 12 == 0) {
    str += '12';
  } else {
    str += (hh % 12);
  }
  str += ':';
  if (mm >= 10) {
    str += mm;
  } else {
    str += '0' + mm;
  }
  str += ':';
  if (ss >= 10) {
    str += ss;
  } else {
    str += '0' + ss;
  }
  if (hh >= 12) {
    str += " PM";
  } else {
    str += " AM";
  }
  $('current_time').innerText = str;
}

// Override from common.js
window.stopAlarmAnimation = function() {
  window.clearTimeout(animationTimer);
  currentClockImage = blankClockImage;
  drawClock();
  isAnimating = false;
};

// Override from common.js
window.displayAlarmAnimation = function() {
  isAnimating = true;
  var rings = 100;
  function ring() {
    if (rings == 0) {
      stopAlarmAnimation();
      return;
    }
    currentClockImage = (rings % 2 == 0)?
                        blankClockAnim1Image:
                        blankClockAnim2Image;
    drawClock();
    rings--;
    animationTimer = window.setTimeout(ring, 50);
  }
  ring();
};

function addOutlineStyleListeners() {
  document.addEventListener('click', function(evt) {
    document.body.classList.add('nooutline');
    return true;
  }, true);
  document.addEventListener('keydown', function(evt) {
    document.body.classList.remove('nooutline');
    return true;
  }, true);
}

function load() {
  try {
    port = chrome.runtime.connect();
    port.onMessage.addListener(function(msg) {
      if (msg.cmd == 'anim') {
        displayAlarmAnimation();
      }
    });
  } catch (e) {
  }

  addOutlineStyleListeners();

  stopAll();
  drawClock();
  setInterval(drawClock, 100);

  updateCurrentTime();
  setInterval(updateCurrentTime, 250);

  function updateTime(timeElement) {
    if (!parseTime(timeElement.value)) {
      return false;
    }

    timeElement.valueAsNumber =
        timeElement.valueAsNumber % (12 * 60 * 60 * 1000);
    if (timeElement.valueAsNumber < (1 * 60 * 60 * 1000))
      timeElement.valueAsNumber += (12 * 60 * 60 * 1000);
    return true;
  }

  $('clock').addEventListener('click', function(evt) {
    if (isPlaying || isSpeaking || isAnimating) {
      stopAll();
    } else {
      ringAlarmWithCurrentTime();
    }
  }, false);
  $('clock').addEventListener('keydown', function(evt) {
    if (evt.keyCode == 13 || evt.keyCode == 32) {
      if (isPlaying || isSpeaking || isAnimating) {
        stopAll();
      } else {
        ringAlarmWithCurrentTime();
      }
    }
  }, false);

  // Alarm 1

  var a1_tt = localStorage['a1_tt'] || DEFAULT_A1_TT;
  $('a1_tt').value = a1_tt;
  $('a1_tt').addEventListener('input', function(evt) {
    updateEnabledStatus(1);
    if (!updateTime($('a1_tt'))) {
      evt.stopPropagation();
      return false;
    }
    localStorage['a1_tt'] = $('a1_tt').value;
    updateEnabledStatus(1);
    return true;
  }, false);
  $('a1_tt').addEventListener('change', function(evt) {
    if ($('a1_tt').value.length == 4 &&
        parseTime('0' + $('a1_tt').value)) {
      $('a1_tt').value = '0' + $('a1_tt').value;
    }
    if (!updateTime($('a1_tt'))) {
      evt.stopPropagation();
      return false;
    }
    localStorage['a1_tt'] = $('a1_tt').value;
    updateEnabledStatus(1);
    return true;
  }, false);

  var a1_on = (localStorage['a1_on'] == 'true');
  $('a1_on').checked = a1_on;
  $('a1_on').addEventListener('change', function(evt) {
    window.setTimeout(function() {
      localStorage['a1_on'] = $('a1_on').checked;
      updateEnabledStatus(1);
    }, 0);
  }, false);

  var a1_ampm = localStorage['a1_ampm'] || DEFAULT_A1_AMPM;
  $('a1_ampm').selectedIndex = a1_ampm;
  $('a1_ampm').addEventListener('change', function(evt) {
    localStorage['a1_ampm'] = $('a1_ampm').selectedIndex;
  }, false);

  updateEnabledStatus(1);

  // Alarm 2

  var a2_tt = localStorage['a2_tt'] || DEFAULT_A2_TT;
  $('a2_tt').value = a2_tt;
  $('a2_tt').addEventListener('input', function(evt) {
    updateEnabledStatus(2);
    if (!updateTime($('a2_tt'))) {
      evt.stopPropagation();
      return false;
    }
    localStorage['a2_tt'] = $('a2_tt').value;
    updateEnabledStatus(2);
    return true;
  }, false);
  $('a2_tt').addEventListener('change', function(evt) {
    if ($('a2_tt').value.length == 4 &&
        parseTime('0' + $('a2_tt').value)) {
      $('a2_tt').value = '0' + $('a2_tt').value;
    }
    if (!updateTime($('a2_tt'))) {
      evt.stopPropagation();
      return false;
    }
    localStorage['a2_tt'] = $('a2_tt').value;
    updateEnabledStatus(2);
    return true;
  }, false);

  var a2_on = (localStorage['a2_on'] == 'true');
  $('a2_on').checked = a2_on;
  $('a2_on').addEventListener('change', function(evt) {
    window.setTimeout(function() {
      localStorage['a2_on'] = $('a2_on').checked;
      updateEnabledStatus(2);
    }, 0);
  }, false);

  var a2_ampm = localStorage['a2_ampm'] || DEFAULT_A2_AMPM;
  $('a2_ampm').selectedIndex = a2_ampm;
  $('a2_ampm').addEventListener('change', function(evt) {
    localStorage['a2_ampm'] = $('a2_ampm').selectedIndex;
  }, false);

  updateEnabledStatus(2);

  // Phrase

  var phrase = localStorage['phrase'] || DEFAULT_PHRASE;
  $('phrase').value = phrase;
  $('phrase').addEventListener('change', function(evt) {
    localStorage['phrase'] = $('phrase').value;
  }, false);

  // Speech parameters

  var rateElement = $('rate');
  var volumeElement = $('volume');
  var rate = localStorage['rate'] || DEFAULT_RATE;
  var volume = localStorage['volume'] || DEFAULT_VOLUME;
  rateElement.value = rate;
  volumeElement.value = volume;
  function listener(evt) {
    rate = rateElement.value;
    localStorage['rate'] = rate;
    volume = volumeElement.value;
    localStorage['volume'] = volume;
  }
  rateElement.addEventListener('keyup', listener, false);
  volumeElement.addEventListener('keyup', listener, false);
  rateElement.addEventListener('mouseup', listener, false);
  volumeElement.addEventListener('mouseup', listener, false);

  var sound = $('sound');
  var currentSound = localStorage['sound'] || DEFAULT_SOUND;
  for (var i = 0; i < sound.options.length; i++) {
    if (sound.options[i].value == currentSound) {
      sound.selectedIndex = i;
      break;
    }
  }
  localStorage['sound'] = sound.options[sound.selectedIndex].value;
  sound.addEventListener('change', function() {
    localStorage['sound'] = sound.options[sound.selectedIndex].value;
  }, false);

  var playSoundButton = $('playsound');
  playSoundButton.addEventListener('click', function(evt) {
    playSound(false);
  });

  var playSpeechButton = $('playspeech');
  playSpeechButton.addEventListener('click', function(evt) {
    speakPhraseWithCurrentTime();
  });

  var voice = $('voice');
  var voiceArray = [];
  if (chrome && chrome.tts) {
    chrome.tts.getVoices(function(va) {
      voiceArray = va;
      for (var i = 0; i < voiceArray.length; i++) {
        var opt = document.createElement('option');
        var name = voiceArray[i].voiceName;
        if (name == localStorage['voice']) {
          opt.setAttribute('selected', '');
        }
        opt.setAttribute('value', name);
        opt.innerText = voiceArray[i].voiceName;
        voice.appendChild(opt);
      }
    });
  }
  voice.addEventListener('change', function() {
    var i = voice.selectedIndex;
    localStorage['voice'] = voiceArray[i].voiceName;
  }, false);
}

document.addEventListener('DOMContentLoaded', load);
