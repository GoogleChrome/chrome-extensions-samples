// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * This class wraps the popup's form, and performs the proper clearing of data
 * based on the user's selections. It depends on the form containing a single
 * select element with an id of 'timeframe', and a single button with an id of
 * 'button'. When you write actual code you should probably be a little more
 * accepting of variance, but this is just a sample app. :)
 *
 * Most of this is boilerplate binding the controller to the UI. The bits that
 * specifically will be useful when using the BrowsingData API are contained in
 * `parseMilliseconds_`, `handleCallback_`, and `handleClick_`.
 *
 * @constructor
 */
var PopupController = function () {
  this.button_ = document.getElementById('button');
  this.timeframe_ = document.getElementById('timeframe');
  this.addListeners_();
};

PopupController.prototype = {
  /**
   * A cached reference to the button element.
   *
   * @type {Element}
   * @private
   */
  button_: null,

  /**
   * A cached reference to the select element.
   *
   * @type {Element}
   * @private
   */
  timeframe_: null,

  /**
   * Adds event listeners to the button in order to capture a user's click, and
   * perform some action in response.
   *
   * @private
   */
  addListeners_: function () {
    this.button_.addEventListener('click', this.handleClick_.bind(this));
  },

  /**
   * Given a string, return milliseconds since epoch. If the string isn't
   * valid, returns undefined.
   *
   * @param {string} timeframe One of 'hour', 'day', 'week', '4weeks', or
   *     'forever'.
   * @returns {number} Milliseconds since epoch.
   * @private
   */
  parseMilliseconds_: function (timeframe) {
    var now = new Date().getTime();
    var milliseconds = {
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      '4weeks': 4 * 7 * 24 * 60 * 60 * 1000
    };

    if (milliseconds[timeframe])
      return now - milliseconds[timeframe];

    if (timeframe === 'forever')
      return 0;

    return null;
  },

  /**
   * Handle a success/failure callback from the `browsingData` API methods,
   * updating the UI appropriately.
   *
   * @private
   */
  handleCallback_: function () {
    var success = document.createElement('div');
    success.classList.add('overlay');
    success.setAttribute('role', 'alert');
    success.textContent = 'Data has been cleared.';
    document.body.appendChild(success);

    setTimeout(function() { success.classList.add('visible'); }, 10);
    setTimeout(function() {
      if (close === false)
        success.classList.remove('visible');
      else
        window.close();
    }, 4000);
  },

  /**
   * When a user clicks the button, this method is called: it reads the current
   * state of `timeframe_` in order to pull a timeframe, then calls the clearing
   * method with appropriate arguments.
   *
   * @private
   */
  handleClick_: function () {
    var removal_start = this.parseMilliseconds_(this.timeframe_.value);
    if (removal_start !== undefined) {
      this.button_.setAttribute('disabled', 'disabled');
      this.button_.innerText = 'Clearing...';
      chrome.browsingData.remove(
          {'since': removal_start}, {
            'appcache': true,
            'cache': true,
            'cacheStorage': true,
            'cookies': true,
            'downloads': true,
            'fileSystems': true,
            'formData': true,
            'history': true,
            'indexedDB': true,
            'localStorage': true,
            'serverBoundCertificates': true,
            'serviceWorkers': true,
            'pluginData': true,
            'passwords': true,
            'webSQL': true
          },
          this.handleCallback_.bind(this));
    }
  }
};

document.addEventListener('DOMContentLoaded', function () {
  window.PC = new PopupController();
});
