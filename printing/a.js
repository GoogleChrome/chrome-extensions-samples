/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

// A collection of utility objects for Chrome applications, used to separate
// code likely to be found in different types of Chrome applications from code
// specific to this particular application. Although general in nature, these
// objects were specifically written for this application and not tested in any
// other context, so they should not be considered part of a reusable framework
// and caution should be exercised when reusing this code outside of this
// application.

"use strict";

var A = A || {};

////////////////////////////////////////////////////////////////////////////////
// Base object. All its methods are intentially generic and can be applied using
// call() or apply() to objects not derived from A.object.

A.object = {
  // Multiple sets of properties can be provided as separate arguments.
  // They will be merged to form the properties of the created object.
  // To derive objects from prototypes other than A.object, use
  // "A.object.create.apply(prototype, arguments)".
  create: function(properties) {
    var object = Object.create(this);
    Array.prototype.forEach.call(arguments, this.copyFrom, object);
    return object;
  },

  // Returns the first of the values identified by the specified paths that is
  // defined. Multiple paths can be specified as separate arguments. No error
  // is raised if components of any of the paths are undefined, so for example
  // "this.ifDefined('a.b', 'c')" will not raise an error if |a| is undefined
  // whereas the otherwise equivalent "this.a.b || this.c" would.
  ifDefined: function(paths) {
    var value, i;
    for (i = 0; i < arguments.length && typeof value === 'undefined'; i += 1) {
      if (arguments[i]) {
        value = this;
        arguments[i].split('.').forEach(function (key) {
          value = (typeof value === 'undefined') ? value :
                  (typeof value === 'boolean') ? new Boolean(value)[key] :
                  (typeof value === 'number') ? new Number(value)[key] :
                  value[key];
        });
      }
    }
    return value;
  },

  // Returns true if and only if the value identified by one of the specified
  // paths is defined. Multiple paths can be specified as separate arguments.
  isDefined: function(paths) {
    var value = this.ifDefined.apply(this, arguments);
    return (typeof value !== 'undefined');
  },

  // Makes a shallow copy of the properties and returns the resulting object,
  // creating that object if |this| is undefined.
  copyFrom: function(from) {
    var copy = this || {};
    var keys = from ? Object.keys(from) : [];
    keys.forEach(function(key) { copy[key] = from[key]; }, this);
    return copy;
  },

  // Makes a shallow copy of the properties and returns the resulting object,
  // creating that object if |to| is undefined.
  copyTo: function(to) {
    return A.object.copyFrom.call(to, this);
  },

  // Adds a listener for the specified event to the specified target. If the
  // specified listener is a string, an event with that name will be added to
  // the receiving object. Listeners for that new event can then be added with
  // separate addListener calls. If the listener is a function, it will be bound
  // to the receiving object.
  addListener: function(target, event, listener) {
    if (A.object.isPrototypeOf(target)) {
      target.listeners_ = target.listeners_ || {};
      target.listeners_[event] = target.listeners_[event] || [];
      target.listeners_[event].push(this.makeListener_(listener));
    } else if (target && target[event] && target[event].addListener) {
      target[event].addListener(this.makeListener_(listener));
    } else if (target) {
      target.addEventListener(event, this.makeListener_(listener));
    }
  },

  /** @private */
  makeListener_: function(listener) {
    if (typeof listener == 'string' && A.object.isPrototypeOf(this)) {
      var event = listener;
      listener = function() {
        if (this.listeners_ && this.listeners_[event]) {
          this.listeners_[event].forEach(function(listener) {
            listener.apply(this.callee, this.arguments);
          }, {callee: this, arguments: arguments});
        }
      };
    }
    return listener.bind ? listener.bind(this) : listener;
  }
};

////////////////////////////////////////////////////////////////////////////////
// Logging. This object's methods can be invoked with any |this| value.

A.console = A.object.create({
  log: function() {
    A.console.console_.log.apply(A.console.console_, arguments);
  },

  logError: function(message, url, line, column, error) {
    A.console.log(error ? error.stack : (message + ':' + line + ':' + column));
  }
});

A.console.console_ = (function() {
  window.onerror = A.console.logError;
  return window.console;
}()),

////////////////////////////////////////////////////////////////////////////////
// Prototype for minimally functional promises objects (http://goo.gl/73FE3B).

// properties = {
//   value = value,       /* Optional, promise fulfilled if present */
// }
A.promise = A.object.create({
  create: function(properties) {
    var promise = A.object.create.apply(this, arguments);
    return promise;
  },

  then: function(onFulfilled) {
    var promise = A.promise.create();
    if (this.hasOwnProperty('value')) {
      this.propagateTo_({promise: promise, onFulfilled: onFulfilled});
    } else {
      this.derived_ = this.derived_ || [];
      this.derived_.push({promise: promise, onFulfilled: onFulfilled});
    }
    return promise;
  },

  fulfill: function(value) {
    if (!this.hasOwnProperty('value')) {
      this.value = value;
      if (this.derived_)
        this.derived_.forEach(this.propagateTo_, this);
    }
    return this;
  },

  /** @private */
  propagateTo_: function(derived) {
    var handler = (derived.onFulfilled || function() { return undefined; });
    var value = handler.call(this, this.value) || this.value;
    if (!A.promise.isPrototypeOf(value)) {
      derived.promise.fulfill(value);
    } else if (typeof value.value !== 'undefined') {
      derived.promise.fulfill(value.value);
    } else {
      value.derived_ = value.derived_ || [];
      value.derived_.push({promise: derived.promise});
    }
  }
});

////////////////////////////////////////////////////////////////////////////////
// Prototype for objects that control window contents.

// properties = {
//   domWindow = domWindow,        /* Optional, overrides other properties */
//   appWindow = appWindow,        /* Optional, overrides other properties */
//   url = 'example.html',         /* Optional, default = 'window.html' */
//   id = 'example',               /* Optional */
//   frame = 'chrome' || 'none',   /* Optional, default = 'chrome' */
//   size = [width, height],       /* Pixels, optional, default = 400 x 300 */
//   sizes = {                     /* Optional, overrides |size| */
//     default = [width, height],  /* Pixels, optional, default = 400 x 300 */
//     minimum = [width, height],  /* Pixels, optional, default = |size| */
//     maximum = [width, height],  /* Pixels, optional, default = |size| */
//   }
// }
A.controller = A.object.create({
  create: function(properties) {
    var controller = A.object.create.apply(this, arguments);
    return controller.getDomWindow_().then(function(domWindow) {
      controller.domWindow = domWindow;
      controller.domDocument = domWindow && domWindow.document;
      controller.addListener(controller.appWindow, 'onClosed', 'close');
      controller.addListener(domWindow, 'focus', 'focus');
      controller.addListener(domWindow, 'resize', 'resize');
      controller.addListener('#close', 'click', window.close.bind(domWindow));
      (domWindow || {}).onerror = A.console.logError;
      return controller;
    });
  },

  getSizes: function() {
    var sizes = this.sizes || {};
    sizes.default = sizes.default || this.size || [400, 300];
    sizes.minimum = sizes.minimum || this.size;
    sizes.maximum = sizes.maximum || this.size;
    return sizes;
  },

  queryElement: function(elementOrSelector) {
    return (typeof elementOrSelector !== 'string') ? elementOrSelector :
           this.domDocument.querySelector(elementOrSelector);
  },

  queryElements: function(elementsOrSelector) {
    return (Array.isArray(elementsOrSelector)) ? elementsOrSelector :
           (typeof elementsOrSelector !== 'string') ? [elementsOrSelector] :
           this.domDocument.querySelectorAll(elementsOrSelector);
  },

  removeAllChildren: function(elementsOrSelector) {
    elementsOrSelector = elementsOrSelector || this.domDocument.body;
    this.queryElements(elementsOrSelector).forEach(function(element) {
      while (element.lastChild)
        element.removeChild(element.lastChild);
    });
  },

  appendChild: function(child, parent) {
    parent = parent || this.domDocument.body;
    return parent.appendChild(child);
  },

  createElement: function(tag, text) {
    var element = this.domDocument.createElement(tag);
    element.textContent = text || '';
    return element;
  },

  createDiv: function(text) {
    return this.createElement('div', text);
  },

  addListener: function(target, event, listener) {
    var elements = this.queryElements(target);
    Array.prototype.forEach.call(elements, function(element) {
      A.object.addListener.call(this, element, event, listener);
    }, this);
  },

  /** @private */
  getDomWindow_: function() {
    var domWindow = this.ifDefined('domWindow', 'appWindow.contentWindow');
    return domWindow ? A.promise.create().fulfill(domWindow) :
                       this.createDomWindow_();
  },

  /** @private */
  createDomWindow_: function() {
    return this.createAppWindow_().then(function(appWindow) {
      this.appWindow = appWindow;
      return appWindow.contentWindow;
    }.bind(this));
  },

  /** @private */
  createAppWindow_: function(promise) {
    var promise = A.promise.create();
    var url = this.url || 'window.html';
    var options = this.getWindowOptions_();
    chrome.app.window.create(url, options, function(appWindow) {
      appWindow.contentWindow.onload = promise.fulfill.bind(promise, appWindow);
    });
    return promise;
  },

  /** @private */
  getWindowOptions_: function() {
    var options = {};
    var sizes = this.getSizes();
    options.defaultWidth = sizes.default[0];
    options.defaultHeight = sizes.default[1];
    options.minWidth = sizes.minimum && sizes.minimum[0];
    options.minHeight = sizes.minimum && sizes.minimum[1];
    options.maxWidth = sizes.maximum && sizes.maximum[0];
    options.maxHeight = sizes.maximum && sizes.maximum[1];
    options.bounds = this.bounds;
    options.id = this.id;
    options.frame = this.frame || 'chrome';
    return options;
  }
});

////////////////////////////////////////////////////////////////////////////////
// Prototype for objects that control applications.

A.application = A.object.create({
  documents: [],

  create: function() {
    if (!A.application.instance) {
      A.application.instance = A.object.create.apply(this, arguments);
    }
    return A.promise.create().fulfill(A.application.instance);
  },

  // Designed to be bound, must be invoked so |this| is the focussed document.
  documentWasFocused: function() {
    Printest.application.documentWasClosed.call(this);
    Printest.application.documents.push(this);
  },

  documentWasClosed: function() {
  // Designed to be bound, must be invoked so |this| is the closed document.
    var index = Printest.application.documents.indexOf(this);
    if (index >= 0)
      Printest.application.documents.splice(index, 1);
  },

  closeAllDocuments: function() {
    // The documents array is copied as it will change during document closure.
    this.documents.slice().forEach(function(document) {
      document.domWindow.close();
    });
  },

  areBoundsInScreen: function(bounds, screen) {
    return bounds.left >= screen.availLeft &&
           bounds.top >= screen.availTop &&
           bounds.left + bounds.width <= screen.availLeft + screen.availWidth &&
           bounds.top + bounds.height <= screen.availTop + screen.availHeight;
  },

  doBoundsOverlapDocument: function(bounds) {
    return this.documents.some(function(document) {
      var documentBounds = document.appWindow.getBounds();
      return (bounds.left < documentBounds.left + documentBounds.width &&
              documentBounds.left < bounds.left + bounds.width &&
              bounds.top < documentBounds.top + documentBounds.height &&
              documentBounds.top < bounds.top + bounds.height);
    });
  }
});
