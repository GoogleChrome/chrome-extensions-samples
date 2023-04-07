// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var timeoutId;
var ttsId = -1;
var ttsWindow;
var milliseconds;
var curOptions;

function areNewOptions(options) {
  var properties = ['voiceName', 'lang', 'rate', 'pitch', 'volume'];

  for (var i = 0; i < properties.length; ++i) {
    if (options[properties[i]] != curOptions[properties[i]]) {
      return true;
    }
  }

  return false;
}

function getTtsElement(element) {
  return ttsWindow.document.getElementById(element);
}

function appendText(text) {
  getTtsElement("text").innerHTML += text;
}

function logOptions() {
  getTtsElement("voiceName").innerHTML = curOptions.voiceName;
  getTtsElement("lang").innerHTML = curOptions.lang;
  getTtsElement("rate").innerHTML = curOptions.rate;
  getTtsElement("pitch").innerHTML = curOptions.pitch;
  getTtsElement("volume").innerHTML = curOptions.volume;
}

function logUtterance(utterance, index, sendTtsEvent) {
  if (index == utterance.length) {
    sendTtsEvent({'type': 'end', 'charIndex': utterance.length});
    return;
  }

  appendText(utterance[index]);

  if (utterance[index] == ' ') {
    sendTtsEvent({'type': 'word', 'charIndex': index});
  }
  else if (utterance[index] == '.' ||
      utterance[index] == '?' ||
      utterance[index] == '!') {
    sendTtsEvent({'type': 'sentence', 'charIndex': index});
  }

  timeoutId = setTimeout(function() {
    logUtterance(utterance, ++index, sendTtsEvent)
  }, milliseconds);
}

var speakListener = function(utterance, options, sendTtsEvent) {
  clearTimeout(timeoutId);

  sendTtsEvent({'type': 'start', 'charIndex': 0});

  if (ttsId == -1) {
    // Create a new window that overlaps the bottom 40% of the current window
    chrome.windows.getCurrent(function(curWindow) {
      chrome.windows.create(
          {"url": "console_tts_engine.html",
           "focused": false,
           "top": Math.round(curWindow.top + 6/10 * curWindow.height),
           "left": curWindow.left,
           "width": curWindow.width,
           "height": Math.round(4/10 * curWindow.height)},
          function(newWindow) {
            ttsId = newWindow.id;
            ttsWindow = chrome.extension.getViews({"windowId": ttsId})[0];

            curOptions = options;
            logOptions();

            // Fastest timeout == 1 ms (@ options.rate = 10.0)
            milliseconds = 10 / curOptions.rate;
            logUtterance(utterance, 0, sendTtsEvent);
          }
      );
    });
  } else {
    if (areNewOptions(options)) {
      curOptions = options;
      logOptions();

      milliseconds = 10 / curOptions.rate;
    }

    logUtterance(utterance, 0, sendTtsEvent);
  }

};

var stopListener = function() {
  clearTimeout(timeoutId);
};

var removedListener = function(windowId, removeInfo) {
  if (ttsId == windowId) {
    ttsId = -1;
  }
}

chrome.ttsEngine.onSpeak.addListener(speakListener);
chrome.ttsEngine.onStop.addListener(stopListener);
chrome.windows.onRemoved.addListener(removedListener);
