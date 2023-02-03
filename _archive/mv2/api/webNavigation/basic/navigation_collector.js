// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Implements the NavigationCollector object that powers the extension.
 *
 * @author mkwst@google.com (Mike West)
 */

/**
 * Collects navigation events, and provides a list of successful requests
 * that you can do interesting things with. Calling the constructor will
 * automatically bind handlers to the relevant webnavigation API events,
 * and to a `getMostRequestedUrls` extension message for internal
 * communication between background pages and popups.
 *
 * @constructor
 */
function NavigationCollector() {
  /**
   * A list of currently pending requests, implemented as a hash of each
   * request's tab ID, frame ID, and URL in order to ensure uniqueness.
   *
   * @type {Object<string, {start: number}>}
   * @private
   */
  this.pending_ = {};

  /**
   * A list of completed requests, implemented as a hash of each
   * request's tab ID, frame ID, and URL in order to ensure uniqueness.
   *
   * @type {Object<string, Array<NavigationCollector.Request>>}
   * @private
   */
  this.completed_ = {};

  /**
   * A list of requests that errored off, implemented as a hash of each
   * request's tab ID, frame ID, and URL in order to ensure uniqueness.
   *
   * @type {Object<string, Array<NavigationCollector.Request>>}
   * @private
   */
  this.errored_ = {};

  // Bind handlers to the 'webNavigation' events that we're interested
  // in handling in order to build up a complete picture of the whole
  // navigation event.
  chrome.webNavigation.onCreatedNavigationTarget.addListener(
      this.onCreatedNavigationTargetListener_.bind(this));
  chrome.webNavigation.onBeforeNavigate.addListener(
      this.onBeforeNavigateListener_.bind(this));
  chrome.webNavigation.onCompleted.addListener(
      this.onCompletedListener_.bind(this));
  chrome.webNavigation.onCommitted.addListener(
      this.onCommittedListener_.bind(this));
  chrome.webNavigation.onErrorOccurred.addListener(
      this.onErrorOccurredListener_.bind(this));
  chrome.webNavigation.onReferenceFragmentUpdated.addListener(
      this.onReferenceFragmentUpdatedListener_.bind(this));
  chrome.webNavigation.onHistoryStateUpdated.addListener(
      this.onHistoryStateUpdatedListener_.bind(this));

  // Bind handler to extension messages for communication from popup.
  chrome.runtime.onMessage.addListener(this.onMessageListener_.bind(this));

  this.loadDataStorage_();
}

///////////////////////////////////////////////////////////////////////////////

/**
 * The possible transition types that explain how the navigation event
 * was generated (i.e. "The user clicked on a link." or "The user submitted
 * a form").
 *
 * @see http://code.google.com/chrome/extensions/trunk/history.html
 * @enum {string}
 */
NavigationCollector.NavigationType = {
  AUTO_BOOKMARK: 'auto_bookmark',
  AUTO_SUBFRAME: 'auto_subframe',
  FORM_SUBMIT: 'form_submit',
  GENERATED: 'generated',
  KEYWORD: 'keyword',
  KEYWORD_GENERATED: 'keyword_generated',
  LINK: 'link',
  MANUAL_SUBFRAME: 'manual_subframe',
  RELOAD: 'reload',
  START_PAGE: 'start_page',
  TYPED: 'typed'
};

/**
 * The possible transition qualifiers:
 *
 * * CLIENT_REDIRECT: Redirects caused by JavaScript, or a refresh meta tag
 *   on a page.
 *
 * * SERVER_REDIRECT: Redirected by the server via a 301/302 response.
 *
 * * FORWARD_BACK: User used the forward or back buttons to navigate through
 *   their browsing history.
 *
 * @enum {string}
 */
NavigationCollector.NavigationQualifier = {
  CLIENT_REDIRECT: 'client_redirect',
  FORWARD_BACK: 'forward_back',
  SERVER_REDIRECT: 'server_redirect'
};

/**
 * @typedef {{url: string, transitionType: NavigationCollector.NavigationType,
 *     transitionQualifier: Array<NavigationCollector.NavigationQualifier>,
 *     openedInNewTab: boolean, source: {frameId: ?number, tabId: ?number},
 *     duration: number}}
 */
NavigationCollector.Request;

///////////////////////////////////////////////////////////////////////////////

NavigationCollector.prototype = {
  /**
   * Returns a somewhat unique ID for a given WebNavigation request.
   *
   * @param {!{tabId: ?number, frameId: ?number}} data Information
   *     about the navigation event we'd like an ID for.
   * @return {!string} ID created by combining the source tab ID and frame ID
   *     (or target tab/frame IDs if there's no source), as the API ensures
   *     that these will be unique across a single navigation event.
   * @private
   */
  parseId_: function(data) {
    return data.tabId + '-' + (data.frameId ? data.frameId : 0);
  },


  /**
   * Creates an empty entry in the pending array if one doesn't already exist,
   * and prepopulates the errored and completed arrays for ease of insertion
   * later.
   *
   * @param {!string} id The request's ID, as produced by parseId_.
   * @param {!string} url The request's URL.
   */
  prepareDataStorage_: function(id, url) {
    this.pending_[id] = this.pending_[id] || {
      openedInNewTab: false,
      source: {
        frameId: null,
        tabId: null
      },
      start: null,
      transitionQualifiers: [],
      transitionType: null
    };
    this.completed_[url] = this.completed_[url] || [];
    this.errored_[url] = this.errored_[url] || [];
  },


  /**
   * Retrieves our saved data from storage.
   * @private
   */
  loadDataStorage_: function() {
    chrome.storage.local.get({
      "completed": {},
      "errored": {},
    }, function(storage) {
      this.completed_ = storage.completed;
      this.errored_ = storage.errored;
    }.bind(this));
  },


  /**
   * Persists our state to the storage API.
   * @private
   */
  saveDataStorage_: function() {
    chrome.storage.local.set({
      "completed": this.completed_,
      "errored": this.errored_,
    });
  },


  /**
   * Resets our saved state to empty.
   */
  resetDataStorage: function() {
    this.completed_ = {};
    this.errored_ = {};
    this.saveDataStorage_();
    // Load again, in case there is an outstanding storage.get request. This
    // one will reload the newly-cleared data.
    this.loadDataStorage_();
  },


  /**
   * Handler for the 'onCreatedNavigationTarget' event. Updates the
   * pending request with a source frame/tab, and notes that it was opened in a
   * new tab.
   *
   * Pushes the request onto the
   * 'pending_' object, and stores it for later use.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onCreatedNavigationTargetListener_: function(data) {
    var id = this.parseId_(data);
    this.prepareDataStorage_(id, data.url);
    this.pending_[id].openedInNewTab = data.tabId;
    this.pending_[id].source = {
      tabId: data.sourceTabId,
      frameId: data.sourceFrameId
    };
    this.pending_[id].start = data.timeStamp;
  },


  /**
   * Handler for the 'onBeforeNavigate' event. Pushes the request onto the
   * 'pending_' object, and stores it for later use.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onBeforeNavigateListener_: function(data) {
    var id = this.parseId_(data);
    this.prepareDataStorage_(id, data.url);
    this.pending_[id].start = this.pending_[id].start || data.timeStamp;
  },


  /**
   * Handler for the 'onCommitted' event. Updates the pending request with
   * transition information.
   *
   * Pushes the request onto the
   * 'pending_' object, and stores it for later use.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onCommittedListener_: function(data) {
    var id = this.parseId_(data);
    if (!this.pending_[id]) {
      console.warn(
          chrome.i18n.getMessage('errorCommittedWithoutPending'),
          data.url,
          data);
    } else {
      this.prepareDataStorage_(id, data.url);
      this.pending_[id].transitionType = data.transitionType;
      this.pending_[id].transitionQualifiers =
          data.transitionQualifiers;
    }
  },


  /**
   * Handler for the 'onReferenceFragmentUpdated' event. Updates the pending
   * request with transition information.
   *
   * Pushes the request onto the
   * 'pending_' object, and stores it for later use.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onReferenceFragmentUpdatedListener_: function(data) {
    var id = this.parseId_(data);
    if (!this.pending_[id]) {
      this.completed_[data.url] = this.completed_[data.url] || [];
      this.completed_[data.url].push({
        duration: 0,
        openedInNewWindow: false,
        source: {
          frameId: null,
          tabId: null
        },
        transitionQualifiers: data.transitionQualifiers,
        transitionType: data.transitionType,
        url: data.url
      });
      this.saveDataStorage_();
    } else {
      this.prepareDataStorage_(id, data.url);
      this.pending_[id].transitionType = data.transitionType;
      this.pending_[id].transitionQualifiers =
          data.transitionQualifiers;
    }
  },


  /**
   * Handler for the 'onHistoryStateUpdated' event. Updates the pending
   * request with transition information.
   *
   * Pushes the request onto the
   * 'pending_' object, and stores it for later use.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onHistoryStateUpdatedListener_: function(data) {
    var id = this.parseId_(data);
    if (!this.pending_[id]) {
      this.completed_[data.url] = this.completed_[data.url] || [];
      this.completed_[data.url].push({
        duration: 0,
        openedInNewWindow: false,
        source: {
          frameId: null,
          tabId: null
        },
        transitionQualifiers: data.transitionQualifiers,
        transitionType: data.transitionType,
        url: data.url
      });
      this.saveDataStorage_();
    } else {
      this.prepareDataStorage_(id, data.url);
      this.pending_[id].transitionType = data.transitionType;
      this.pending_[id].transitionQualifiers =
          data.transitionQualifiers;
    }
  },


  /**
   * Handler for the 'onCompleted` event. Pulls the request's data from the
   * 'pending_' object, combines it with the completed event's data, and pushes
   * a new NavigationCollector.Request object onto 'completed_'.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onCompletedListener_: function(data) {
    var id = this.parseId_(data);
    if (!this.pending_[id]) {
      console.warn(
          chrome.i18n.getMessage('errorCompletedWithoutPending'),
          data.url,
          data);
    } else {
      this.completed_[data.url].push({
        duration: (data.timeStamp - this.pending_[id].start),
        openedInNewWindow: this.pending_[id].openedInNewWindow,
        source: this.pending_[id].source,
        transitionQualifiers: this.pending_[id].transitionQualifiers,
        transitionType: this.pending_[id].transitionType,
        url: data.url
      });
      delete this.pending_[id];
      this.saveDataStorage_();
    }
  },


  /**
   * Handler for the 'onErrorOccurred` event. Pulls the request's data from the
   * 'pending_' object, combines it with the completed event's data, and pushes
   * a new NavigationCollector.Request object onto 'errored_'.
   *
   * @param {!Object} data The event data generated for this request.
   * @private
   */
  onErrorOccurredListener_: function(data) {
    var id = this.parseId_(data);
    if (!this.pending_[id]) {
      console.error(
          chrome.i18n.getMessage('errorErrorOccurredWithoutPending'),
          data.url,
          data);
    } else {
      this.prepareDataStorage_(id, data.url);
      this.errored_[data.url].push({
        duration: (data.timeStamp - this.pending_[id].start),
        openedInNewWindow: this.pending_[id].openedInNewWindow,
        source: this.pending_[id].source,
        transitionQualifiers: this.pending_[id].transitionQualifiers,
        transitionType: this.pending_[id].transitionType,
        url: data.url
      });
      delete this.pending_[id];
      this.saveDataStorage_();
    }
  },

  /**
   * Handle messages from the popup.
   *
   * @param {!{type:string}} message The external message to answer.
   * @param {!MessageSender} sender Info about the script context that sent
   *     the message.
   * @param {!function} sendResponse Function to call to send a response.
   * @private
   */
  onMessageListener_: function(message, sender, sendResponse) {
    if (message.type === 'getMostRequestedUrls')
      sendResponse({result: this.getMostRequestedUrls(message.num)});
    else
      sendResponse({});
  },

///////////////////////////////////////////////////////////////////////////////

  /**
   * @return {Object<string, NavigationCollector.Request>} The complete list of
   *     successful navigation requests.
   */
  get completed() {
    return this.completed_;
  },


  /**
   * @return {Object<string, Navigationcollector.Request>} The complete list of
   *     unsuccessful navigation requests.
   */
  get errored() {
    return this.errored_;
  },


  /**
   * Get a list of the X most requested URLs.
   *
   * @param {number=} num The number of successful navigation requests to
   *     return. If 0 is passed in, or the argument left off entirely, all
   *     successful requests are returned.
   * @return {Object<string, NavigationCollector.Request>} The list of
   *     successful navigation requests, sorted in decending order of frequency.
   */
  getMostRequestedUrls: function(num) {
    return this.getMostFrequentUrls_(this.completed, num);
  },


  /**
   * Get a list of the X most errored URLs.
   *
   * @param {number=} num The number of unsuccessful navigation requests to
   *     return. If 0 is passed in, or the argument left off entirely, all
   *     successful requests are returned.
   * @return {Object<string, NavigationCollector.Request>} The list of
   *     unsuccessful navigation requests, sorted in decending order
   *     of frequency.
   */
  getMostErroredUrls: function(num) {
    return this.getMostErroredUrls_(this.errored, num);
  },


  /**
   * Get a list of the most frequent URLs in a list.
   *
   * @param {NavigationCollector.Request} list A list of URLs to parse.
   * @param {number=} num The number of navigation requests to return. If
   *     0 is passed in, or the argument left off entirely, all requests
   *     are returned.
   * @return {Object<string, NavigationCollector.Request>} The list of
   *     navigation requests, sorted in decending order of frequency.
   * @private
   */
  getMostFrequentUrls_: function(list, num) {
    var result = [];
    var avg;
    // Convert the 'completed_' object to an array.
    for (var x in list) {
      avg = 0;
      if (list.hasOwnProperty(x) && list[x].length) {
        list[x].forEach(function(o) {
          avg += o.duration;
        });
        avg = avg / list[x].length;
        result.push({
          url: x,
          numRequests: list[x].length,
          requestList: list[x],
          average: avg
        });
      }
    }
    // Sort the array.
    result.sort(function(a, b) {
      return b.numRequests - a.numRequests;
    });
    // Return the requested number of results.
    return num ? result.slice(0, num) : result;
  }
};
