// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Stubs for Chrome extension APIs that aren't available to
 * regular web pages, to allow tests to run.
 */

chrome = chrome || {};
chrome.extension = chrome.extension || {};
chrome.contentSettings = chrome.contentSettings || {};

var _rules = {};
chrome.contentSettings.plugins = {
  'set': function(details, callback) {
    assertObjectEquals({'id': 'myplugin'}, details.resourceIdentifier);
    var pattern = details.primaryPattern;
    var setting = details.setting;
    if (pattern == '__invalid_pattern') {
      chrome.runtime.lastError = {'message': 'Invalid pattern'};
    } else if (setting == '__invalid_setting') {
      throw Error('Invalid setting');
    } else {
      chrome.runtime.lastError = undefined;
      _rules[pattern] = setting;
    }
    callback();
  },

  'clear': function(details, callback) {
    assertObjectEquals({}, details);
    _rules = {};
    callback();
  }
};

chrome.i18n = chrome.i18n || {};
chrome.i18n.getMessage = function(id) {
  var messages = {
    'patternColumnHeader': 'Hostname Pattern',
    'settingColumnHeader': 'Behavior',
    'allowRule': 'Allow',
    'blockRule': 'Block',
    'addNewPattern': 'Add a new hostname pattern',
  };
  return messages[id];
}

/**
 * Creates a new Settings object with a set of rules for a dummy plugin.
 * Because we provide stub implementations for the Chrome contentSettings
 * extension API, we know that the methods will execute immediately instead of
 * asynchronously.
 * @param {!Object} rules A map from content settings pattern to setting.
 * @return {!pluginSettings.Settings} A newly created Settings object with the
 *     passed in set of rules.
 */
function createSettings(rules) {
  var settings = new pluginSettings.Settings('myplugin');
  if (rules) {
    for (var pattern in rules) {
      settings.set(pattern, rules[pattern], function() {});
    }
  }
  return settings;
}

