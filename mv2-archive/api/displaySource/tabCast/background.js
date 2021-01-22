// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var g_sessionInfo = {};

/**
 * When extension icon clicked, get device list
 * Then return the list to popup page
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.browserActionClicked) {
    getDeviceList(function(deviceList) {
      sendResponse({ returnDeviceList: deviceList });
    });
  }
  return true;
});

function getDeviceList(callback) {
  chrome.displaySource.getAvailableSinks(callback);
}

chrome.displaySource.onSessionTerminated.addListener(function(terminatedSink) {
  chrome.runtime.sendMessage({ sessionTerminated: true,
                               currentSinkId: terminatedSink });

  if (g_sessionInfo.stream) {
    g_sessionInfo.stream.getTracks().forEach(function (track) {
        track.stop(); });
    delete g_sessionInfo.stream;
  }
  delete g_sessionInfo.sinkId;
});

chrome.displaySource.onSinksUpdated.addListener(function(updatedSinks) {
  console.log('Sinks updated');
  chrome.runtime.sendMessage({ sinksUpdated: true,
                               currentSinkId: g_sessionInfo.sinkId,
                               sinksList: updatedSinks});
});

function start(sinkId) {
  // If no session, proceed.
  if (!g_sessionInfo.sinkId) {
    g_sessionInfo.sinkId = parseInt(sinkId);
    captureTabAndStartSession(g_sessionInfo.sinkId);
  }
}

function captureTabAndStartSession(sink_id) {
  chrome.tabs.getCurrent(function(tab) {
      var video_constraints = {
          mandatory: {
              chromeMediaSource: 'tab',
              minWidth: 1920,
              minHeight: 1080,
              maxWidth: 1920,
              maxHeight: 1080,
              minFrameRate: 60,
              maxFrameRate: 60
          }
       };

       var constraints = {
           audio: true,
           video: true,
           videoConstraints: video_constraints
       };

       function onStream(stream) {
         g_sessionInfo.stream = stream;
         var session_info = {
             sinkId: sink_id,
             videoTrack: g_sessionInfo.stream.getVideoTracks()[0],
             audioTrack: g_sessionInfo.stream.getAudioTracks()[0]
         };

         function onStarted() {
           if (chrome.runtime.error) {
           console.log('The Session to sink ' + g_sessionInfo.sinkId
               + 'could not start, error: '
               + chrome.runtime.lastError.message);
           } else {
             console.log('The Session to sink ' + g_sessionInfo.sinkId
             + ' has started.');
           }
         }
         console.log('Starting session to sink: ' + sink_id);
         chrome.displaySource.startSession(session_info, onStarted);
       }

       chrome.tabCapture.capture(constraints, onStream);
  });
}

function stop() {
  function onTerminated() {
    if (chrome.runtime.lastError) {
      console.log('The Session to sink ' + g_sessionInfo.sinkId
          + 'could not terminate, error: '
          + chrome.runtime.lastError.message);
    } else {
      console.log('The Session to sink ' + g_sessionInfo.sinkId
          + ' has terminated.');
    }
  }
  console.log('Terminating session to sink: ' + g_sessionInfo.sinkId);
  chrome.displaySource.terminateSession(g_sessionInfo.sinkId, onTerminated);
}
