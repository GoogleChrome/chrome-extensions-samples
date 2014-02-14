var voices;
var utteranceIndex = 0;

var enqueue = document.getElementById('enqueue');
var lang = document.getElementById('lang');
var pitch = document.getElementById('pitch');
var rate = document.getElementById('rate');
var text = document.getElementById('srctext');
var ttsStatusBox = document.getElementById('ttsStatusBox');
var ttsStatus = document.getElementById('ttsStatus');
var voiceInfo = document.getElementById('voiceInfo');
var voicesSelect = document.getElementById('voices');
var volume = document.getElementById('volume');

function speak(utterance, highlightText) {
  var options = {
    'enqueue' : Boolean(enqueue.value),
    'lang': lang.value,
    'pitch': Number(pitch.value),
    'rate': Number(rate.value),
    'volume': Number(volume.value),
    'voiceName': voicesSelect.value,
    'onEvent': function(event) {
        console.debug(utteranceIndex, event);
        if (event.type == 'error') {
          console.error(event);
        }
        if (highlightText) {
          text.setSelectionRange(0, event.charIndex);
        }
        if (event.type == 'end' ||
            event.type == 'interrupted' ||
            event.type == 'cancelled' ||
            event.type == 'error') {
          chrome.tts.isSpeaking(function(isSpeaking) {
            if (!isSpeaking) {
              ttsStatus.textContent = 'Idle';
              ttsStatusBox.classList.remove('busy');
            }
          });
        }
    }
  };
  console.debug(++utteranceIndex, options);
  
  chrome.tts.speak(utterance, options);

  ttsStatus.textContent = 'Busy';
  ttsStatusBox.classList.add('busy');
}

document.getElementById('speak').addEventListener('click', function() {
  speak(text.value, true);
});

document.getElementById('alpha').addEventListener('focus', function() {
  speak('Alpha');
});

document.getElementById('bravo').addEventListener('focus', function() {
  speak('Bravo');
});

document.getElementById('charlie').addEventListener('focus', function() {
  speak('Charlie');
});

document.getElementById('delta').addEventListener('focus', function() {
  speak('Delta');
});

document.getElementById('echo').addEventListener('focus', function() {
  speak('Echo');
});

document.getElementById('foxtrot').addEventListener('focus', function() {
  speak('Foxtrot');
});

document.getElementById('stop').addEventListener('click', function() {
  chrome.tts.stop();
});

voicesSelect.addEventListener('change', function() {
  voiceInfo.textContent = '';
  for (var i = 0; i < voices.length; i++) {
    if (voices[i].voiceName === this.value) {
      voiceInfo.textContent = JSON.stringify(voices[i], null, 2);
      break;
    }
  }
});

chrome.tts.getVoices(function(availableVoices) {
  voices = availableVoices;
  for (var i = 0; i < voices.length; i++) {
    voicesSelect.add(new Option(voices[i].voiceName, voices[i].voiceName));
  }
});

