/**
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

/**
 * @fileoverview Defines the constants and most commonly used functions.
 * @author navneetg@google.com (Navneet Goel).
 */

/**
 * Default feed news URL.
 */
var DEFAULT_NEWS_URL = 'http://news.google.com/news?output=rss';

/**
 * Image URL of Israel country.
 */
var ISRAEL_IMAGE_URL = 'http://www.gstatic.com/news/img/logo/iw_il/news.gif';

/**
 * Alias for getElementById.
 * @param {String} elementId Element id of the HTML element to be fetched.
 * @return {Element} Element corresponding to the element id.
 */
function $(elementId) {
  return document.getElementById(elementId);
}
