// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This file implements the ProxyErrorHandler class, which will
 * flag proxy errors in a visual way for the extension's user.
 *
 * @author Mike West <mkwst@google.com>
 */


/**
 * The proxy error handling object. Binds to the 'onProxyError' event, and
 * changes the extensions badge to reflect the error state (yellow for
 * non-fatal errors, red for fatal).
 *
 * @constructor
 */
function ProxyErrorHandler() {
  // Handle proxy error events.
  chrome.proxy.onProxyError.addListener(this.handleError_.bind(this));

  // Handle message events from popup.
  chrome.extension.onRequest.addListener(this.handleOnRequest_.bind(this));
};

///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {{fatal: boolean, error: string, details: string}}
 */
ProxyErrorHandler.ErrorDetails;

///////////////////////////////////////////////////////////////////////////////

ProxyErrorHandler.prototype = {
  /**
   * Details of the most recent error.
   * @type {?ProxyErrorHandler.ErrorDetails}
   * @private
   */
  lastError_: null,

   /**
    * Handle request messages from the popup.
    *
    * @param {!{type:string}} request The external request to answer.
    * @param {!MessageSender} sender Info about the script context that sent
    *     the request.
    * @param {!function} sendResponse Function to call to send a response.
    * @private
    */
  handleOnRequest_: function(request, sender, sendResponse) {
    if (request.type === 'getError') {
      sendResponse({result: this.getErrorDetails()});
    } else if (request.type === 'clearError') {
      this.clearErrorDetails();
      sendResponse({result: true});
    }
  },

  /**
   * Handles the error event, storing the error details for later use, and
   * badges the browser action icon.
   *
   * @param {!ProxyErrorHandler.ErrorDetails} details The error details.
   * @private
   */
  handleError_: function(details) {
    var RED = [255, 0, 0, 255];
    var YELLOW = [255, 205, 0, 255];

    // Badge the popup icon.
    var color = details.fatal ? RED : YELLOW;
    chrome.browserAction.setBadgeBackgroundColor({color: color});
    chrome.browserAction.setBadgeText({text: 'X'});
    chrome.browserAction.setTitle({
      title: chrome.i18n.getMessage('errorPopupTitle', details.error)
    });

    // Store the error for display in the popup.
    this.lastError_ = JSON.stringify(details);
  },


  /**
   * Returns details of the last error handled.
   *
   * @return {?ProxyErrorHandler.ErrorDetails}
   */
  getErrorDetails: function() {
    return this.lastError_;
  },


  /**
   * Clears last handled error.
   */
  clearErrorDetails: function() {
    chrome.browserAction.setBadgeText({text: ''});
    this.lastError_ = null;
  }
}
