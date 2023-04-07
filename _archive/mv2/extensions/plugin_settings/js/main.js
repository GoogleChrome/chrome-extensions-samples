// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Main entry point that creates a new plugin list on document
 * load.
 */

document.addEventListener('DOMContentLoaded', function() {
  chrome.contentSettings.plugins.getResourceIdentifiers(function(r) {
    if (chrome.runtime.lastError) {
      $('error').textContent =
          'Error: ' + chrome.runtime.lastError.message;
      return;
    }
    var pluginList = $('plugin-list');
    pluginSettings.ui.PluginList.decorate(pluginList);
    pluginList.dataModel = new cr.ui.ArrayDataModel(r);
  });
});

