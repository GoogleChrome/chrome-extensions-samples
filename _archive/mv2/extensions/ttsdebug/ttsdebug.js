/**
 * Copyright (c) 2011 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

var voiceArray;
var trials = 3;
var resultMap = {};
var updateDependencyFunctions = [];
var testRunIndex = 0;
var emergencyStop = false;

function $(id) {
  return document.getElementById(id);
}

function isErrorEvent(evt) {
  return (evt.type == 'error' ||
          evt.type == 'interrupted' ||
          evt.type == 'cancelled');
}

function logEvent(callTime, testRunName, evt) {
  var elapsed = ((new Date() - callTime) / 1000).toFixed(3);
  while (elapsed.length < 7) {
    elapsed = ' ' + elapsed;
  }
  console.log(elapsed + ' ' + testRunName + ': ' + JSON.stringify(evt));
}

function logSpeakCall(utterance, options, callback) {
  var optionsCopy = {};
  for (var key in options) {
    if (key != 'onEvent') {
      optionsCopy[key] = options[key];
    }
  }
  console.log('Calling chrome.tts.speak(\'' +
              utterance + '\', ' +
              JSON.stringify(optionsCopy) + ')');
  if (callback)
    chrome.tts.speak(utterance, options, callback);
  else
    chrome.tts.speak(utterance, options);
}

var tests = [
  {
    name: 'Baseline',
    description: 'Ensures that the speech engine sends both start and ' +
                 'end events, and establishes a baseline time to speak a ' +
                 'key phrase, to compare other tests against.',
    dependencies: [],
    trials: 3,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var warnings = [];
      var errors = [];
      logSpeakCall('Alpha Bravo Charlie Delta Echo', {
        voiceName: voiceName,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'start') {
            startTime = new Date();
            if (evt.charIndex != 0) {
              errors.push('Error: start event should have a charIndex of 0.');
            }
          } else if (evt.type == 'end') {
            if (startTime == undefined) {
              errors.push('Error: no "start" event received!');
              startTime = callTime;
            }
            if (evt.charIndex != 30) {
              errors.push('Error: end event should have a charIndex of 30.');
            }
            var endTime = new Date();
            if (startTime - callTime > 1000) {
              var delta = ((startTime - callTime) / 1000).toFixed(3);
              warnings.push('Note: Delay of ' + delta +
                            ' before speech started. ' +
                            'Less than 1.0 s latency is recommended.');
            }
            var delta = (endTime - startTime) / 1000;
            if (delta < 1.0) {
              warnings.push('Warning: Default speech rate seems too fast.');
            } else if (delta > 3.0) {
              warnings.push('Warning: Default speech rate seems too slow.');
            }
            callback(errors.length == 0, delta, warnings.concat(errors));
          }
        }
      });
    }
  },
  {
    name: 'Fast',
    description: 'Speaks twice as fast and compares the time to the baseline.',
    dependencies: ['Baseline'],
    trials: 3,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var errors = [];
      logSpeakCall('Alpha Bravo Charlie Delta Echo', {
        voiceName: voiceName,
        rate: 2.0,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'start') {
            startTime = new Date();
          } else if (evt.type == 'end') {
            if (startTime == undefined)
              startTime = callTime;
            var endTime = new Date();
            var delta = (endTime - startTime) / 1000;
            var relative = delta / resultMap['Baseline'];
            if (relative < 0.35) {
              errors.push('2x speech rate seems too fast.');
            } else if (relative > 0.65) {
              errors.push('2x speech rate seems too slow.');
            }
            callback(errors.length == 0, delta, errors);
          }
        }
      });
    }
  },
  {
    name: 'Slow',
    description: 'Speaks twice as slow and compares the time to the baseline.',
    dependencies: ['Baseline'],
    trials: 3,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var errors = [];
      logSpeakCall('Alpha Bravo Charlie Delta Echo', {
        voiceName: voiceName,
        rate: 0.5,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'start') {
            startTime = new Date();
          } else if (evt.type == 'end') {
            if (startTime == undefined)
              startTime = callTime;
            var endTime = new Date();
            var delta = (endTime - startTime) / 1000;
            var relative = delta / resultMap['Baseline'];
            if (relative < 1.6) {
              errors.push('Half-speed speech rate seems too fast.');
            } else if (relative > 2.4) {
              errors.push('Half-speed speech rate seems too slow.');
            }
            callback(errors.length == 0, delta, errors);
          }
        }
      });
    }
  },
  {
    name: 'Interrupt and restart',
    description: 'Interrupts partway through a long sentence and then ' +
                 'the baseline utterance, to make sure that speech after ' +
                 'an interruption works correctly.',
    dependencies: ['Baseline'],
    trials: 1,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var errors = [];
      logSpeakCall('When in the course of human events it becomes ' +
                       'necessary for one people to dissolve the political ' +
                       'bands which have connected them ', {
        voiceName: voiceName,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
        }
      });
      window.setTimeout(function() {
        logSpeakCall('Alpha Bravo Charlie Delta Echo', {
          voiceName: voiceName,
          onEvent: function(evt) {
            logEvent(callTime, testRunName, evt);
            if (isErrorEvent(evt)) {
              callback(false, null, []);
            } else if (evt.type == 'start') {
              startTime = new Date();
            } else if (evt.type == 'end') {
              if (startTime == undefined)
                startTime = callTime;
              var endTime = new Date();
              var delta = (endTime - startTime) / 1000;
              var relative = delta / resultMap['Baseline'];
              if (relative < 0.9) {
                errors.push('Interrupting speech seems too short.');
              } else if (relative > 1.1) {
                errors.push('Interrupting speech seems too long.');
              }
              callback(errors.length == 0, delta, errors);
            }
          }
        });
      }, 4000);
    }
  },
  {
    name: 'Low volume',
    description: '<b>Manual</b> test - verify that the volume is lower.',
    dependencies: [],
    trials: 1,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      logSpeakCall('Alpha Bravo Charlie Delta Echo', {
        voiceName: voiceName,
        volume: 0.5,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'end') {
            callback(true, null, []);
          }
        }
      });
    }
  },
  {
    name: 'High pitch',
    description: '<b>Manual</b> test - verify that the pitch is ' +
                 'moderately higher, but quite understandable.',
    dependencies: [],
    trials: 1,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      logSpeakCall('Alpha Bravo Charlie Delta Echo', {
        voiceName: voiceName,
        pitch: 1.2,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'end') {
            callback(true, null, []);
          }
        }
      });
    }
  },
  {
    name: 'Low pitch',
    description: '<b>Manual</b> test - verify that the pitch is ' +
                 'moderately lower, but quite understandable.',
    dependencies: [],
    trials: 1,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      logSpeakCall('Alpha Bravo Charlie Delta Echo', {
        voiceName: voiceName,
        pitch: 0.8,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'end') {
            callback(true, null, []);
          }
        }
      });
    }
  },
  {
    name: 'Word and sentence callbacks',
    description: 'Checks to see if proper word and sentence callbacks ' +
                 'are received.',
    dependencies: ['Baseline'],
    trials: 1,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var errors = [];
      var wordExpected = [{min: 5, max: 6},
                          {min: 11, max: 12},
                          {min: 19, max: 20},
                          {min: 25, max: 26},
                          {min: 30, max: 32},
                          {min: 37, max: 38},
                          {min: 43, max: 44},
                          {min: 51, max: 52},
                          {min: 57, max: 58}];
      var sentenceExpected = [{min: 30, max: 32}]
      var wordCount = 0;
      var sentenceCount = 0;
      var lastWordTime = callTime;
      var lastSentenceTime = callTime;
      var avgWordTime = resultMap['Baseline'] / 5;
      logSpeakCall('Alpha Bravo Charlie Delta Echo. ' +
                       'Alpha Bravo Charlie Delta Echo.', {
        voiceName: voiceName,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'start') {
            startTime = new Date();
            lastWordTime = startTime;
            lastSentenceTime = startTime;
          } else if (evt.type == 'word') {
            if (evt.charIndex > 0 && evt.charIndex < 62) {
              var min = wordExpected[wordCount].min;
              var max = wordExpected[wordCount].max;
              if (evt.charIndex < min || evt.charIndex > max) {
                errors.push('Got word at charIndex ' + evt.charIndex + ', ' +
                            'was expecting next word callback charIndex ' +
                            'in the range ' + min + ':' + max + '.');
              }
              if (wordCount != 4) {
                var delta = (new Date() - lastWordTime) / 1000;
                if (delta < 0.6 * avgWordTime) {
                  errors.push('Word at charIndex ' + evt.charIndex +
                              ' came after only ' + delta.toFixed(3) +
                              ' s, which seems too short.');
                } else if (delta > 1.3 * avgWordTime) {
                  errors.push('Word at charIndex ' + evt.charIndex +
                              ' came after ' + delta.toFixed(3) +
                              ' s, which seems too long.');
                }
              }
              wordCount++;
            }
            lastWordTime = new Date();
          } else if (evt.type == 'sentence') {
            if (evt.charIndex > 0 && evt.charIndex < 62) {
              var min = sentenceExpected[sentenceCount].min;
              var max = sentenceExpected[sentenceCount].max;
              if (evt.charIndex < min || evt.charIndex > max) {
                errors.push('Got sentence at charIndex ' + evt.charIndex +
                            ', was expecting next callback charIndex ' +
                            'in the range ' + min + ':' + max + '.');
              }
              var delta = (new Date() - lastSentenceTime) / 1000;
              if (delta < 0.75 * resultMap['Baseline']) {
                errors.push('Sentence at charIndex ' + evt.charIndex +
                            ' came after only ' + delta.toFixed(3) +
                            ' s, which seems too short.');
              } else if (delta > 1.25 * resultMap['Baseline']) {
                errors.push('Sentence at charIndex ' + evt.charIndex +
                            ' came after ' + delta.toFixed(3) +
                            ' s, which seems too long.');
              }
              sentenceCount++;
            }
            lastSentenceTime = new Date();
          } else if (evt.type == 'end') {
            if (wordCount == 0) {
              errors.push('Didn\'t get any word callbacks.');
            } else if (wordCount < wordExpected.length) {
              errors.push('Not enough word callbacks.');
            } else if (wordCount > wordExpected.length) {
              errors.push('Too many word callbacks.');
            }
            if (sentenceCount == 0) {
              errors.push('Didn\'t get any sentence callbacks.');
            } else if (sentenceCount < sentenceExpected.length) {
              errors.push('Not enough sentence callbacks.');
            } else if (sentenceCount > sentenceExpected.length) {
              errors.push('Too many sentence callbacks.');
            }
            if (startTime == undefined) {
              errors.push('Error: no "start" event received!');
              startTime = callTime;
            }
            var endTime = new Date();
            var delta = (endTime - startTime) / 1000;
            if (delta < 2.5) {
              errors.push('Default speech rate seems too fast.');
            } else if (delta > 7.0) {
              errors.push('Default speech rate seems too slow.');
            }
            callback(errors.length == 0, delta, errors);
          }
        }
      });
    }
  },
  {
    name: 'Baseline Queueing Test',
    description: 'Establishes a baseline time to speak a ' +
                 'sequence of three enqueued phrases, to compare ' +
                 'other tests against.',
    dependencies: [],
    trials: 3,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var errors = [];
      logSpeakCall('Alpha Alpha', {
        voiceName: voiceName,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'start') {
            startTime = new Date();
          }
        }
      });
      logSpeakCall('Bravo bravo.', {
        voiceName: voiceName,
        enqueue: true,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          }
        }
      });
      logSpeakCall('Charlie charlie', {
        voiceName: voiceName,
        enqueue: true,
        onEvent: function(evt) {
          logEvent(callTime, testRunName, evt);
          if (isErrorEvent(evt)) {
            callback(false, null, []);
          } else if (evt.type == 'end') {
            if (startTime == undefined) {
              errors.push('Error: no "start" event received!');
              startTime = callTime;
            }
            var endTime = new Date();
            var delta = (endTime - startTime) / 1000;
            callback(errors.length == 0, delta, errors);
          }
        }
      });
    }
  },
  {
    name: 'Interruption with Queueing',
    description: 'Queue a sequence of three utterances, then before they ' +
                 'are finished, interrupt and queue a sequence of three ' +
                 'more utterances. Make sure that interrupting and ' +
                 'cancelling the previous utterances doesn\'t interfere ' +
                 'with the interrupting utterances.',
    dependencies: ['Baseline Queueing Test'],
    trials: 1,
    run: function(testRunName, voiceName, callback) {
      var callTime = new Date();
      var startTime;
      var errors = [];

      logSpeakCall('Just when I\'m about to say something interesting,', {
        voiceName: voiceName
      });
      logSpeakCall('it seems that I always get interrupted.', {
        voiceName: voiceName,
        enqueue: true,
      });
      logSpeakCall('How rude! Will you ever let me finish?', {
        voiceName: voiceName,
        enqueue: true,
      });

      window.setTimeout(function() {
        logSpeakCall('Alpha Alpha', {
          voiceName: voiceName,
          onEvent: function(evt) {
            logEvent(callTime, testRunName, evt);
            if (isErrorEvent(evt)) {
              callback(false, null, []);
            } else if (evt.type == 'start') {
              startTime = new Date();
            }
          }
        });
        logSpeakCall('Bravo bravo.', {
          voiceName: voiceName,
          enqueue: true,
          onEvent: function(evt) {
            logEvent(callTime, testRunName, evt);
            if (isErrorEvent(evt)) {
              callback(false, null, []);
            }
          }
        });
        logSpeakCall('Charlie charlie', {
          voiceName: voiceName,
          enqueue: true,
          onEvent: function(evt) {
            logEvent(callTime, testRunName, evt);
            if (isErrorEvent(evt)) {
              callback(false, null, []);
            } else if (evt.type == 'end') {
              if (startTime == undefined) {
                errors.push('Error: no "start" event received!');
                startTime = callTime;
              }
              var endTime = new Date();
              var delta = (endTime - startTime) / 1000;
              var relative = delta / resultMap['Baseline Queueing Test'];
              if (relative < 0.9) {
                errors.push('Interrupting speech seems too short.');
              } else if (relative > 1.1) {
                errors.push('Interrupting speech seems too long.');
              }
              callback(errors.length == 0, delta, errors);
            }
          }
        });
      }, 4000);
    }
  }
];

function updateDependencies() {
  for (var i = 0; i < updateDependencyFunctions.length; i++) {
    updateDependencyFunctions[i]();
  }
}

function registerTest(test) {
  var outer = document.createElement('div');
  outer.className = 'outer';
  $('container').appendChild(outer);

  var buttonWrap = document.createElement('div');
  buttonWrap.className = 'buttonWrap';
  outer.appendChild(buttonWrap);

  var button = document.createElement('button');
  button.className = 'runTestButton';
  button.innerText = test.name;
  buttonWrap.appendChild(button);

  var busy = document.createElement('img');
  busy.src = 'pacman.gif';
  busy.alt = 'Busy indicator';
  buttonWrap.appendChild(busy);
  busy.style.visibility = 'hidden';

  var description = document.createElement('div');
  description.className = 'description';
  description.innerHTML = test.description;
  outer.appendChild(description);

  var resultsWrap = document.createElement('div');
  resultsWrap.className = 'results';
  outer.appendChild(resultsWrap);
  var results = [];
  for (var j = 0; j < test.trials; j++) {
    var result = document.createElement('span');
    resultsWrap.appendChild(result);
    results.push(result);
  }
  var avg = document.createElement('span');
  resultsWrap.appendChild(avg);

  var messagesWrap = document.createElement('div');
  messagesWrap.className = 'messages';
  outer.appendChild(messagesWrap);

  var totalTime;
  var successCount;

  function finishTrials() {
    busy.style.visibility = 'hidden';
    if (successCount == test.trials) {
      console.log('Test succeeded.');
      var success = document.createElement('div');
      success.className = 'success';
      success.innerText = 'Test succeeded.';
      messagesWrap.appendChild(success);
      if (totalTime > 0.0) {
        var avgTime = totalTime / test.trials;
        avg.className = 'result';
        avg.innerText = 'Avg: ' + avgTime.toFixed(3) + ' s';
        resultMap[test.name] = avgTime;
        updateDependencies();
      }
    } else {
      console.log('Test failed.');
      var failure = document.createElement('div');
      failure.className = 'failure';
      failure.innerText = 'Test failed.';
      messagesWrap.appendChild(failure);
    }
  }

  function runTest(index, voiceName) {
    if (emergencyStop) {
      busy.style.visibility = 'hidden';
      emergencyStop = false;
      return;
    }
    var testRunName = 'Test run ' + testRunIndex + ', ' +
                      test.name + ', trial ' + (index+1) + ' of ' +
                      test.trials;
    console.log('*** Beginning ' + testRunName +
                ' with voice ' + voiceName);
    test.run(testRunName, voiceName, function(success, resultTime, errors) {
      if (success) {
        successCount++;
      }
      for (var i = 0; i < errors.length; i++) {
        console.log(errors[i]);
        var error = document.createElement('div');
        error.className = 'error';
        error.innerText = errors[i];
        messagesWrap.appendChild(error);
      }
      if (resultTime != null) {
        results[index].className = 'result';
        results[index].innerText = resultTime.toFixed(3) + ' s';
        totalTime += resultTime;
      }
      index++;
      if (index < test.trials) {
        runTest(index, voiceName);
      } else {
        finishTrials();
      }
    });
  }

  button.addEventListener('click', function() {
    var voiceIndex = $('voices').selectedIndex - 1;
    if (voiceIndex < 0) {
      alert('Please select a voice first!');
      return;
    }
    testRunIndex++;
    busy.style.visibility = 'visible';
    totalTime = 0.0;
    successCount = 0;
    messagesWrap.innerHTML = '';
    var voiceName = voiceArray[voiceIndex].voiceName;
    runTest(0, voiceName);
  }, false);

  updateDependencyFunctions.push(function() {
    for (var i = 0; i < test.dependencies.length; i++) {
      if (resultMap[test.dependencies[i]] != undefined) {
        button.disabled = false;
        outer.className = 'outer';
      } else {
        button.disabled = true;
        outer.className = 'outer disabled';
      }
    }
  });
}

function load() {
  var voice = localStorage['voice'];
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
      $('voices').appendChild(opt);
    }
  });
  $('voices').addEventListener('change', function() {
    var i = $('voices').selectedIndex;
    localStorage['voice'] = $('voices').item(i).value;
  }, false);
  $('stop').addEventListener('click', stop);

  for (var i = 0; i < tests.length; i++) {
    registerTest(tests[i]);
  }
  updateDependencies();
}

function stop() {
  console.log('*** Emergency stop!');
  emergencyStop = true;
  chrome.tts.stop();
}

document.addEventListener('DOMContentLoaded', load);
