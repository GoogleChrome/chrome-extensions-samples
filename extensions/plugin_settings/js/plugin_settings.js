// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Defines a class that provides some convenient wrapper methods
 * around the Chrome contentSettings extension API.
 */

cr.define('pluginSettings', function() {
  /** @const */ var EventTarget = cr.EventTarget;

  /**
   * Creates a new content settings model.
   * @param {string} plugin Identifies the plugin for which this object stores
   *     settings.
   * @constructor
   * @extends {cr.EventTarget}
   */
  function Settings(plugin) {
    /**
     * Identifies the plugin for which this object stores settings.
     * @type {string}
     * @private
     */
    this.plugin_ = plugin;
  }

  Settings.prototype = {
    __proto__: cr.EventTarget.prototype,

    /**
     * Clears all content settings, and recreates them from local storage. If a
     * content setting can't be set (which shouldn't really happen, as it has
     * been successfully set previously), it is removed from local storage as
     * well.
     * @param {function()} callback Called when the content settings have been
     *     recreated, or on error.
     * @private
     */
    recreateRules_: function(callback) {
      chrome.contentSettings.plugins.clear(
          {}, this.didClearRules_.bind(this, callback));
    },

    /**
     * Recreates all content settings from local storage.
     * @param {function()} callback Called when the content settings have been
     *     recreated, or on error.
     * @private
     */
    didClearRules_: function(callback) {
      if (chrome.runtime.lastError) {
        console.error('Error clearing rules');
        callback();
        return;
      }
      var length = window.localStorage.length;
      if (length == 0) {
        cr.dispatchSimpleEvent(settings, 'change');
        callback();
        return;
      }
      var counter = {
        'value': length
      };
      for (var i = 0; i < length; i++) {
        var key = window.localStorage.key(i);
        var keyArray = JSON.parse(key);
        var plugin = keyArray[0];
        var pattern = keyArray[1];
        var setting = window.localStorage.getItem(key)
        chrome.contentSettings.plugins.set(
            {
              'primaryPattern': pattern,
              'resourceIdentifier': {'id': plugin},
              'setting': setting,
            },
            this.didSetContentSetting_.bind(
                this, key, setting, counter, callback));
      }
    },

    /**
     * Checks if we're finished with recreating content settings and calls the
     * passed in callback if so.
     * @param {string} key The local storage key under which the content
     *     setting was stored.
     * @param {string} value The content setting value in local storage.
     * @param {{value:number}} counter Contains the number of callbacks still
     *     outstanding.
     * @param {function()} callback Called when the content settings have been
     *     recreated, or on error.
     * @private
     */
    didSetContentSetting_: function(plugin, pattern, key, counter, callback) {
      if (chrome.runtime.lastError) {
        console.error(
            'Error restoring [' + key + ': ' + value + ']: ' +
                chrome.runtime.lastError.message);
        window.localStorage.removeItem(key);
      }
      counter.value--;
      if (counter.value == 0) {
        cr.dispatchSimpleEvent(this, 'change');
        callback();
      }
    },

    /**
     * Creates a content setting rule and calls the passed in callback with the
     * result.
     * @param {string} pattern The content setting pattern for the rule.
     * @param {string} setting The setting for the rule.
     * @param {function(?string)} callback Called when the content settings
     *     have been updated, or on error.
     */
    set: function(pattern, setting, callback) {
      var plugin = this.plugin_;
      var settings = this;
      chrome.contentSettings.plugins.set({
        'primaryPattern': pattern,
        'resourceIdentifier': { 'id': plugin },
        'setting': setting,
      }, function() {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError.message);
        } else {
          window.localStorage.setItem(JSON.stringify([plugin, pattern]),
                                      setting);
          cr.dispatchSimpleEvent(settings, 'change');
          callback();
        }
      });
    },

    /**
     * Removes the content setting rule with a given pattern, and calls the
     * passed in callback afterwards.
     * @param {string} pattern The content setting pattern for the rule.
     * @param {function()} callback Called when the content settings have
     * been updated.
     */
    clear: function(pattern, callback) {
      window.localStorage.removeItem(
          JSON.stringify([this.plugin_, pattern]));
      this.recreateRules_(callback);
    },

    /**
     * Updates the content setting rule with a given pattern to a new pattern
     * and setting and calls the passed in callback with the result.
     * @param {string} oldPattern The old content setting pattern for the rule.
     * @param {string} newPattern The new content setting pattern for the rule.
     * @param {string} setting The setting for the rule.
     * @param {function(?string)} callback Called when the content settings
     *     have been updated, or on error.
     */
    update: function(oldPattern, newPattern, setting, callback) {
      if (oldPattern == newPattern) {
        // Avoid recreating all rules if only the setting changed.
        this.set(newPattern, setting, callback);
        return;
      }
      var oldSetting = this.get(oldPattern);
      var settings = this;
      // Remove the old rule.
      this.clear(oldPattern, function() {
        // Try to set the new rule.
        settings.set(newPattern, setting, function(error) {
          if (error) {
            // If setting the new rule failed, restore the old rule.
            settings.set(oldPattern, oldSetting, function(restoreError) {
              if (restoreError) {
                console.error('Error restoring [' + settings.plugin_ + ', ' +
                              oldPattern + oldSetting + ']: ' + restoreError);
              }
              callback(error);
            });
          } else {
            callback();
          }
        });
      });
    },

    /**
     * Returns the content setting for a given pattern.
     * @param {string} pattern The content setting pattern for the rule.
     * @return {string} The setting for the rule.
     */
    get: function(primaryPattern) {
      return window.localStorage.getItem(
          JSON.stringify([this.plugin_, primaryPattern]));
    },

    /**
     * @return {!Array} A list of all content setting rules for this plugin.
     */
    getAll: function() {
      var rules = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);
        var keyArray = JSON.parse(key);
        if (keyArray[0] == this.plugin_) {
          rules.push({
            'primaryPattern': keyArray[1],
            'setting': window.localStorage.getItem(key),
          });
        }
      }
      return rules;
    }
  };

  return {
    Settings: Settings,
  }
});
