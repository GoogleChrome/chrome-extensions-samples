// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * The global object.
 * @type {!Object}
 */
const global = this;

/**
 * Alias for document.getElementById.
 * @param {string} id The ID of the element to find.
 * @return {HTMLElement} The found element or null if not found.
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Calls chrome.send with a callback and restores the original afterwards.
 * @param {string} name The name of the message to send.
 * @param {!Array} params The parameters to send.
 * @param {string} callbackName The name of the function that the backend calls.
 * @param {!Function} The function to call.
 */
function chromeSend(name, params, callbackName, callback) {
  var old = global[callbackName];
  global[callbackName] = function() {
    // restore
    global[callbackName] = old;

    var args = Array.prototype.slice.call(arguments);
    return callback.apply(global, args);
  };
  chrome.send(name, params);
}

/**
 * Generates a CSS url string.
 * @param {string} s The URL to generate the CSS url for.
 * @return {string} The CSS url string.
 */
function url(s) {
  // http://www.w3.org/TR/css3-values/#uris
  // Parentheses, commas, whitespace characters, single quotes (') and double
  // quotes (") appearing in a URI must be escaped with a backslash
  var s2 = s.replace(/(\(|\)|\,|\s|\'|\"|\\)/g, '\\$1');
  // WebKit has a bug when it comes to URLs that end with \
  // https://bugs.webkit.org/show_bug.cgi?id=28885
  if (/\\\\$/.test(s2)) {
    // Add a space to work around the WebKit bug.
    s2 += ' ';
  }
  return 'url("' + s2 + '")';
}

/**
 * Parses query parameters from Location.
 * @param {string} s The URL to generate the CSS url for.
 * @return {object} Dictionary containing name value pairs for URL
 */
function parseQueryParams(location) {
  var params = {};
  var query = unescape(location.search.substring(1));
  var vars = query.split("&");
  for (var i=0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    params[pair[0]] = pair[1];
  }
  return params;
}

function findAncestorByClass(el, className) {
  return findAncestor(el, function(el) {
    if (el.classList)
      return el.classList.contains(className);
    return null;
  });
}

/**
 * Return the first ancestor for which the {@code predicate} returns true.
 * @param {Node} node The node to check.
 * @param {function(Node) : boolean} predicate The function that tests the
 *     nodes.
 * @return {Node} The found ancestor or null if not found.
 */
function findAncestor(node, predicate) {
  var last = false;
  while (node != null && !(last = predicate(node))) {
    node = node.parentNode;
  }
  return last ? node : null;
}

function swapDomNodes(a, b) {
  var afterA = a.nextSibling;
  if (afterA == b) {
    swapDomNodes(b, a);
    return;
  }
  var aParent = a.parentNode;
  b.parentNode.replaceChild(a, b);
  aParent.insertBefore(b, afterA);
}

/**
 * Disables text selection and dragging.
 */
function disableTextSelectAndDrag() {
  // Disable text selection.
  document.onselectstart = function(e) {
    e.preventDefault();
  }

  // Disable dragging.
  document.ondragstart = function(e) {
    e.preventDefault();
  }
}

// Handle click on a link. If the link points to a chrome: or file: url, then
// call into the browser to do the navigation.
document.addEventListener('click', function(e) {
  // Allow preventDefault to work.
  if (!e.returnValue)
    return;

  var el = e.target;
  if (el.nodeType == Node.ELEMENT_NODE &&
      el.webkitMatchesSelector('A, A *')) {
    while (el.tagName != 'A') {
      el = el.parentElement;
    }

    if ((el.protocol == 'file:' || el.protocol == 'about:') &&
        (e.button == 0 || e.button == 1)) {
      chrome.send('navigateToUrl', [
        el.href,
        el.target,
        e.button,
        e.altKey,
        e.ctrlKey,
        e.metaKey,
        e.shiftKey
      ]);
      e.preventDefault();
    }
  }
});
