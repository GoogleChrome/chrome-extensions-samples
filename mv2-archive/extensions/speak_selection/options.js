// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function load() {
  var selectedElement = document.getElementById('selected');
  var sel = window.getSelection();
  sel.removeAllRanges();
  var range = document.createRange();
  range.selectNode(selectedElement);
  sel.addRange(range);

  var rateElement = document.getElementById('rate');
  var pitchElement = document.getElementById('pitch');
  var volumeElement = document.getElementById('volume');
  var rate = localStorage['rate'] || 1.0;
  var pitch = localStorage['pitch'] || 1.0;
  var volume = localStorage['volume'] || 1.0;
  rateElement.value = rate;
  pitchElement.value = pitch;
  volumeElement.value = volume;
  function listener(evt) {
    rate = rateElement.value;
    localStorage['rate'] = rate;
    pitch = pitchElement.value;
    localStorage['pitch'] = pitch;
    volume = volumeElement.value;
    localStorage['volume'] = volume;
  }
  rateElement.addEventListener('keyup', listener, false);
  pitchElement.addEventListener('keyup', listener, false);
  volumeElement.addEventListener('keyup', listener, false);
  rateElement.addEventListener('mouseup', listener, false);
  pitchElement.addEventListener('mouseup', listener, false);
  volumeElement.addEventListener('mouseup', listener, false);

  var defaultsButton = document.getElementById('defaults');
  defaultsButton.addEventListener('click', function(evt) {
    rate = 1.0;
    pitch = 1.0;
    volume = 1.0;
    localStorage['rate'] = rate;
    localStorage['pitch'] = pitch;
    localStorage['volume'] = volume;
    rateElement.value = rate;
    pitchElement.value = pitch;
    volumeElement.value = volume;
  }, false);

  var voice = document.getElementById('voice');
  var voiceArray = [];
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
  voice.addEventListener('change', function() {
    var i = voice.selectedIndex;
    localStorage['voice'] = voiceArray[i].voiceName;
  }, false);

  var defaultKeyString = getDefaultKeyString();

  var keyString = localStorage['speakKey'];
  if (keyString == undefined) {
    keyString = defaultKeyString;
  }

  var testButton = document.getElementById('test');
  testButton.addEventListener('click', function(evt) {
    chrome.tts.speak(
        'Testing speech synthesis',
        {voiceName: localStorage['voice'],
         rate: parseFloat(rate),
         pitch: parseFloat(pitch),
         volume: parseFloat(volume)});
  });

  var hotKeyElement = document.getElementById('hotkey');
  hotKeyElement.value = keyString;
  hotKeyElement.addEventListener('keydown', function(evt) {
    switch (evt.keyCode) {
      case 27:  // Escape
        evt.stopPropagation();
        evt.preventDefault();
        hotKeyElement.blur();
        return false;
      case 8:   // Backspace
      case 46:  // Delete
        evt.stopPropagation();
        evt.preventDefault();
        hotKeyElement.value = '';
        localStorage['speakKey'] = '';
        sendKeyToAllTabs('');
        window.speakKeyStr = '';
        return false;
      case 9:  // Tab
        return false;
      case 16:  // Shift
      case 17:  // Control
      case 18:  // Alt/Option
      case 91:  // Meta/Command
        evt.stopPropagation();
        evt.preventDefault();
        return false;
    }
    var keyStr = keyEventToString(evt);
    if (keyStr) {
      hotKeyElement.value = keyStr;
      localStorage['speakKey'] = keyStr;
      sendKeyToAllTabs(keyStr);

      // Set the key used by the content script running in the options page.
      window.speakKeyStr = keyStr;
    }
    evt.stopPropagation();
    evt.preventDefault();
    return false;
  }, true);
}

document.addEventListener('DOMContentLoaded', load);
