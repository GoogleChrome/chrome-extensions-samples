// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.runtime.sendMessage({ browserActionClicked : true }, function(response) {
  var deviceList = response.returnDeviceList;
  var backgroundPage = chrome.extension.getBackgroundPage();
  createButtonList(deviceList, backgroundPage);
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  var deviceButton = document.getElementById(message.currentSinkId);
  var backgroundPage = chrome.extension.getBackgroundPage();

  if (message.sinksUpdated) {
    var sinks = message.sinksList;
    var changedSink = null;

    for (let sink of sinks) {
      if (sink.id == message.currentSinkId) {
        changedSink = sink;
      }
    }

    if (!changedSink) {
      console.error('Failed to find sink: ' + message.currentSinkId);
      return;
    }

    if (changedSink.state == 'Connecting') {
      changeButtonState(deviceButton, 'connecting', backgroundPage.stop);
    } else if (changedSink.state == 'Connected') {
      changeButtonState(deviceButton, 'connected', backgroundPage.stop);
    }
  } else if (message.sessionTerminated) {
    changeButtonState(deviceButton, 'disconnected', backgroundPage.start);
  }
});

function createButtonList(deviceList, backgroundPage) {
  var divElement = document.getElementById('deviceList');
  if (!deviceList || !deviceList.length) {
    var errorMessage = document.createTextNode('No available '
        + 'sink devices found');
    divElement.appendChild(errorMessage);
    return;
  }

  deviceList.forEach(function(device) {
    if (!document.getElementById(device.id)) {
      var deviceButton = document.createElement('input');

      deviceButton.type = 'button';
      deviceButton.value = device.name;
      deviceButton.id = device.id;

      if (device.state == 'Disconnected') {
        changeButtonState(deviceButton, 'disconnected', backgroundPage.start);
      } else if (device.state == 'Connecting') {
        changeButtonState(deviceButton, 'connecting', backgroundPage.stop);
      } else if (device.state == 'Connected') {
        changeButtonState(deviceButton, 'connected', backgroundPage.stop);
      } else {
        console.error('Unexpected sink state.');
        return;
      }

      divElement.appendChild(deviceButton);
    }
  });
}

function changeButtonState(button, styleName, method) {
  button.className = styleName;
  var sinkId = parseInt(button.id);
  button.onclick = function() { method(sinkId) };
}

