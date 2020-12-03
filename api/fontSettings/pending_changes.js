// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * @fileoverview PendingChanges class tracks changes to be applied when an
 * "Apply Changes" button is clicked.
 */

/**
 * Creates a PendingChanges object with no pending changes.
 *
 * @constructor
 */
var PendingChanges = function() {
  // Format: pendingFontChanges_.Cyrl.sansserif = "My SansSerif Cyrillic Font"
  this.pendingFontChanges_ = {};

  // Format: pendingFontSizeChanges_.defaultFontSize = 12
  this.pendingFontSizeChanges_ = {};
};

/**
 * Returns the pending font setting change for the specified script and family,
 * or null if it doesn't exist.
 *
 * @param {string} script The script code, like "Cyrl".
 * @param {string} genericFamily The generic family, like "sansserif".
 * @return {?string} The pending font setting, like "My Cyrillic SansSerif Font"
 *     or null if it doesn't exist.
 */
PendingChanges.prototype.getFont = function(script, genericFamily) {
  if (this.pendingFontChanges_[script])
    return this.pendingFontChanges_[script][genericFamily];
  return null;
};

/**
 * Returns the pending font size setting change, or null if it doesn't exist.
 *
 * @param {string} fontSizeKey The font size setting key. One of
 *     'defaultFontSize', 'defaultFixedFontSize', or 'minFontSize'.
 * @return {?number} The pending font size setting in pixels, or null if it
 *     doesn't exist.
 */
PendingChanges.prototype.getFontSize = function(fontSizeKey) {
  return this.pendingFontSizeChanges_[fontSizeKey];
};

/**
 * Sets the pending font change for the specified script and family.
 *
 * @param {string} script The script code, like "Cyrl".
 * @param {string} genericFamily The generic family, like "sansserif".
 * @param {?string} font The font to set the setting to, or null to clear it.
 */
PendingChanges.prototype.setFont = function(script, genericFamily, font) {
  if (!this.pendingFontChanges_[script])
    this.pendingFontChanges_[script] = {};
  if (this.pendingFontChanges_[script][genericFamily] == font)
    return;
  this.pendingFontChanges_[script][genericFamily] = font;
};

/**
 * Sets the pending font size change.
 *
 * @param {string} fontSizeKey The font size setting key. See
 *     getFontSize().
 * @param {number} size The font size to set the setting to.
 */
PendingChanges.prototype.setFontSize = function(fontSizeKey, size) {
  if (this.pendingFontSizeChanges_[fontSizeKey] == size)
    return;
  this.pendingFontSizeChanges_[fontSizeKey] = size;
};

/**
 * Commits the pending changes to Chrome. After this function is called, there
 * are no pending changes.
 */
PendingChanges.prototype.apply = function() {
  for (var script in this.pendingFontChanges_) {
    for (var genericFamily in this.pendingFontChanges_[script]) {
      var fontId = this.pendingFontChanges_[script][genericFamily];
      if (fontId == null)
        continue;
      var details = {};
      details.script = script;
      details.genericFamily = genericFamily;
      details.fontId = fontId;
      chrome.fontSettings.setFont(details);
    }
  }

  var size = this.pendingFontSizeChanges_['defaultFontSize'];
  if (size != null)
    chrome.fontSettings.setDefaultFontSize({pixelSize: size});

  size = this.pendingFontSizeChanges_['defaultFixedFontSize'];
  if (size != null)
    chrome.fontSettings.setDefaultFixedFontSize({pixelSize: size});

  size = this.pendingFontSizeChanges_['minFontSize'];
  if (size != null)
    chrome.fontSettings.setMinimumFontSize({pixelSize: size});

  this.clear();
};

/**
 * Clears the pending font changes for a single script.
 *
 * @param {string} script The script code, like "Cyrl".
 */
PendingChanges.prototype.clearOneScript = function(script) {
  this.pendingFontChanges_[script] = {};
};

/**
 * Clears all pending font changes.
 */
PendingChanges.prototype.clear = function() {
  this.pendingFontChanges_ = {};
  this.pendingFontSizeChanges_ = {};
};

/**
 * @return {boolean} True if there are no pending changes, otherwise false.
 */
PendingChanges.prototype.isEmpty = function() {
  for (var script in this.pendingFontChanges_) {
    for (var genericFamily in this.pendingFontChanges_[script]) {
      if (this.pendingFontChanges_[script][genericFamily] != null)
        return false;
    }
  }
  for (var name in this.pendingFontSizeChanges_) {
    if (this.pendingFontSizeChanges_[name] != null)
      return false;
  }
  return true;
};
