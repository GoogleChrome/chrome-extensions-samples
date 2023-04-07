// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This code supports the popup behaviour of the extension, and
 *               demonstrates how to:
 *
 *               1) Set the zoom for a tab using tabs.setZoom()
 *               2) Read the current zoom of a tab using tabs.getZoom()
 *               3) Set the zoom mode of a tab using tabs.setZoomSettings()
 *               4) Read the current zoom mode of a tab using
 *               tabs.getZoomSettings()
 *
 *               It also demonstrates using a zoom change listener to update the
 *               contents of a control.
 */

zoomStep = 1.1;
tabId = -1;

function displayZoomLevel(level) {
  var percentZoom = parseFloat(level) * 100;
  var zoom_percent_str = percentZoom.toFixed(1) + '%';

  document.getElementById('displayDiv').textContent = zoom_percent_str;
}

document.addEventListener('DOMContentLoaded', function() {
  // Find the tabId of the current (active) tab. We could just omit the tabId
  // parameter in the function calls below, and they would act on the current
  // tab by default, but for the purposes of this demo we will always use the
  // API with an explicit tabId to demonstrate its use.
  chrome.tabs.query({active: true}, function (tabs) {
    if (tabs.length > 1)
      console.log(
          '[ZoomDemoExtension] Query unexpectedly returned more than 1 tab.');
    tabId = tabs[0].id;

    chrome.tabs.getZoomSettings(tabId, function(zoomSettings) {
      var modeRadios = document.getElementsByName('modeRadio');
      for (var i = 0; i < modeRadios.length; i++) {
        if (modeRadios[i].value == zoomSettings.mode)
          modeRadios[i].checked = true;
      }

      var scopeRadios = document.getElementsByName('scopeRadio');
      for (var i = 0; i < scopeRadios.length; i++) {
        if (scopeRadios[i].value == zoomSettings.scope)
          scopeRadios[i].checked = true;
      }

      var percentDefaultZoom =
          parseFloat(zoomSettings.defaultZoomFactor) * 100;
      document.getElementById('defaultLabel').textContent =
          'Default: ' + percentDefaultZoom.toFixed(1) + '%';
    });

    chrome.tabs.getZoom(tabId, displayZoomLevel);
  });

  document.getElementById('increaseButton').onclick = doZoomIn;
  document.getElementById('decreaseButton').onclick = doZoomOut;
  document.getElementById('defaultButton').onclick = doZoomDefault;
  document.getElementById('setModeButton').onclick = doSetMode;
  document.getElementById('closeButton').onclick = doClose;
});

function zoomChangeListener(zoomChangeInfo) {
  displayZoomLevel(zoomChangeInfo.newZoomFactor);
}

chrome.tabs.onZoomChange.addListener(zoomChangeListener);

function changeZoomByFactorDelta(factorDelta) {
  if (tabId == -1)
    return;

  chrome.tabs.getZoom(tabId, function(zoomFactor) {
    var newZoomFactor = factorDelta * zoomFactor;
    chrome.tabs.setZoom(tabId, newZoomFactor, function() {
      if (chrome.runtime.lastError)
        console.log('[ZoomDemoExtension] ' + chrome.runtime.lastError.message);
    });
  });
}

function doZoomIn() {
  changeZoomByFactorDelta(zoomStep);
}

function doZoomOut() {
  changeZoomByFactorDelta(1.0/zoomStep);
}

function doZoomDefault() {
  if (tabId == -1)
    return;

  chrome.tabs.setZoom(tabId, 0, function() {
    if (chrome.runtime.lastError)
      console.log('[ZoomDemoExtension] ' + chrome.runtime.lastError.message);
  });
}

function doSetMode() {
  if (tabId == -1)
    return;

  var modeVal;
  var modeRadios = document.getElementsByName('modeRadio');
  for (var i = 0; i < modeRadios.length; i++) {
    if (modeRadios[i].checked)
      modeVal = modeRadios[i].value;
  }

  var scopeVal;
  var scopeRadios = document.getElementsByName('scopeRadio');
  for (var i = 0; i < scopeRadios.length; i++) {
    if (scopeRadios[i].checked)
      scopeVal = scopeRadios[i].value;
  }

  if (!modeVal || !scopeVal) {
    console.log(
        '[ZoomDemoExtension] Must specify values for both mode & scope.');
    return;
  }

  chrome.tabs.setZoomSettings(tabId, { mode: modeVal, scope: scopeVal },
    function() {
      if (chrome.runtime.lastError) {
        console.log('[ZoomDemoExtension] doSetMode() error: ' +
                    chrome.runtime.lastError.message);
      }
    });
}

function doClose() {
  self.close();
}
