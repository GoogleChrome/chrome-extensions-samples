// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview In this extension, the background page demonstrates how to
 *               listen for zoom change events.
*/

function zoomChangeListener(zoomChangeInfo) {
  var settings_str = "mode:" + zoomChangeInfo.zoomSettings.mode +
      ", scope:" + zoomChangeInfo.zoomSettings.scope;

  console.log('[ZoomDemoExtension] zoomChangeListener(tab=' +
              zoomChangeInfo.tabId + ', new=' +
              zoomChangeInfo.newZoomFactor + ', old=' +
              zoomChangeInfo.oldZoomFactor + ', ' +
              settings_str + ')');
}

chrome.tabs.onZoomChange.addListener(zoomChangeListener);
