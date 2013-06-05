var text;
var ttsStatus;
var ttsStatusBox;
var lang;
var enqueue;
var voices;
var voiceInfo;
var voiceArray;
var utteranceIndex = 0;

onload = function() {
  text = document.getElementById('srctext');
  ttsStatus = document.getElementById('ttsStatus');
  ttsStatusBox = document.getElementById('ttsStatusBox');
  lang = document.getElementById('lang');
  enqueue = document.getElementById('enqueue');
  voices = document.getElementById('voices');
  voiceInfo = document.getElementById('voiceInfo');


  document.getElementById('speak').onclick = function speakUserText() {
    var options = {};
    if (lang.value) {
      options.lang = lang.value;
    }
    speak(text.value, options, true);
  }

  document.getElementById('alpha').onfocus = function () {
    speak("Alpha");
  };
  
  document.getElementById('bravo').onfocus = function () {
    speak("Bravo");
  };
  
  document.getElementById('charlie').onfocus = function () {
    speak("Charlie");
  };

  document.getElementById('delta').onfocus = function () {
    speak("Delta");
  };
  
  document.getElementById('echo').onfocus = function () {
    speak("Echo");
  };

  document.getElementById('foxtrot').onfocus = function () {
    speak("Foxtrot");
  };

  document.querySelector('#stop').onclick = function stop() {
    chrome.tts.stop();
  }


  chrome.tts.getVoices(function(va) {
    voiceArray = va;
    for (var i = 0; i < voiceArray.length; i++) {
      var opt = document.createElement('option');
      opt.setAttribute('value', voiceArray[i].voiceName);
      opt.innerText = voiceArray[i].voiceName;
      voices.appendChild(opt);
    }
  });
  voices.addEventListener('change', function() {
    var i = voices.selectedIndex - 1;
    if (i >= 0) {
      voiceInfo.innerText = JSON.stringify(voiceArray[i], null, 2);
    } else {
      voiceInfo.innerText = '';
    }
  }, false);
}

function speak(str, options, highlightText) {
  if (!options) {
    options = {};
  }
  if (enqueue.value) {
    options.enqueue = Boolean(enqueue.value);
  }
  var voiceIndex = voices.selectedIndex - 1;
  if (voiceIndex >= 0) {
    options.voiceName = voiceArray[voiceIndex].voiceName;
  }
  var rateValue = Number(rate.value);
  if (rateValue >= 0.1 && rateValue <= 10.0) {
    options.rate = rateValue;
  }
  var pitchValue = Number(pitch.value);
  if (pitchValue >= 0.0 && pitchValue <= 2.0) {
    options.pitch = pitchValue;
  }
  var volumeValue = Number(volume.value);
  if (volumeValue >= 0.0 && volumeValue <= 1.0) {
    options.volume = volumeValue;
  }
  utteranceIndex++;
  console.log(utteranceIndex + ': ' + JSON.stringify(options));
  options.onEvent = function(event) {
    console.log(utteranceIndex + ': ' + JSON.stringify(event));
    if (highlightText) {
      text.setSelectionRange(0, event.charIndex);
    }
    if (event.type == 'end' ||
        event.type == 'interrupted' ||
        event.type == 'cancelled' ||
        event.type == 'error') {
      chrome.tts.isSpeaking(function(isSpeaking) {
        if (!isSpeaking) {
          ttsStatus.innerHTML = 'Idle';
          ttsStatusBox.style.background = '#fff';
        }
      });
    }
  };
  chrome.tts.speak(
      str, options, function() {
    if (chrome.extension.lastError) {
      console.log('TTS Error: ' + chrome.extension.lastError.message);
    }
  });
  ttsStatus.innerHTML = 'Busy';
  ttsStatusBox.style.background = '#ffc';
}


