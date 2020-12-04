// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const cr = (function() {

  /**
   * Whether we are using a Mac or not.
   * @type {boolean}
   */
  const isMac = /Mac/.test(navigator.platform);

  /**
   * Whether this is on the Windows platform or not.
   * @type {boolean}
   */
  const isWindows = /Win/.test(navigator.platform);

  /**
   * Whether this is on chromeOS or not.
   * @type {boolean}
   */
  const isChromeOS = /CrOS/.test(navigator.userAgent);

  /**
   * Whether this is on vanilla Linux (not chromeOS).
   * @type {boolean}
   */
  const isLinux = /Linux/.test(navigator.userAgent);

  /**
   * Sets the os and toolkit attributes in the <html> element so that platform
   * specific css rules can be applied.
   */
  function enablePlatformSpecificCSSRules() {
    if (isMac)
      doc.documentElement.setAttribute('os', 'mac');
    if (isWindows)
      doc.documentElement.setAttribute('os', 'windows');
    if (isChromeOS)
      doc.documentElement.setAttribute('os', 'chromeos');
    if (isLinux)
      doc.documentElement.setAttribute('os', 'linux');
  }

  /**
   * Builds an object structure for the provided namespace path,
   * ensuring that names that already exist are not overwritten. For
   * example:
   * "a.b.c" -> a = {};a.b={};a.b.c={};
   * @param {string} name Name of the object that this file defines.
   * @param {*=} opt_object The object to expose at the end of the path.
   * @param {Object=} opt_objectToExportTo The object to add the path to;
   *     default is {@code window}.
   * @private
   */
  function exportPath(name, opt_object, opt_objectToExportTo) {
    var parts = name.split('.');
    var cur = opt_objectToExportTo || window /* global */;

    for (var part; parts.length && (part = parts.shift());) {
      if (!parts.length && opt_object !== undefined) {
        // last part and we have an object; use it
        cur[part] = opt_object;
      } else if (part in cur) {
        cur = cur[part];
      } else {
        cur = cur[part] = {};
      }
    }
    return cur;
  };

  /**
   * Fires a property change event on the target.
   * @param {EventTarget} target The target to dispatch the event on.
   * @param {string} propertyName The name of the property that changed.
   * @param {*} newValue The new value for the property.
   * @param {*} oldValue The old value for the property.
   */
  function dispatchPropertyChange(target, propertyName, newValue, oldValue) {
    var e = new CrEvent(propertyName + 'Change');
    e.propertyName = propertyName;
    e.newValue = newValue;
    e.oldValue = oldValue;
    target.dispatchEvent(e);
  }

  /**
   * The kind of property to define in {@code defineProperty}.
   * @enum {number}
   */
  const PropertyKind = {
    /**
     * Plain old JS property where the backing data is stored as a "private"
     * field on the object.
     */
    JS: 'js',

    /**
     * The property backing data is stored as an attribute on an element.
     */
    ATTR: 'attr',

    /**
     * The property backing data is stored as an attribute on an element. If the
     * element has the attribute then the value is true.
     */
    BOOL_ATTR: 'boolAttr'
  };

  /**
   * Helper function for defineProperty that returns the getter to use for the
   * property.
   * @param {string} name
   * @param {cr.PropertyKind} kind
   * @return {function():*} The getter for the property.
   */
  function getGetter(name, kind) {
    switch (kind) {
      case PropertyKind.JS:
        var privateName = name + '_';
        return function() {
          return this[privateName];
        };
      case PropertyKind.ATTR:
        return function() {
          return this.getAttribute(name);
        };
      case PropertyKind.BOOL_ATTR:
        return function() {
          return this.hasAttribute(name);
        };
    }
  }

  /**
   * Helper function for defineProperty that returns the setter of the right
   * kind.
   * @param {string} name The name of the property we are defining the setter
   *     for.
   * @param {cr.PropertyKind} kind The kind of property we are getting the
   *     setter for.
   * @param {function(*):void} opt_setHook A function to run after the property
   *     is set, but before the propertyChange event is fired.
   * @return {function(*):void} The function to use as a setter.
   */
  function getSetter(name, kind, opt_setHook) {
    switch (kind) {
      case PropertyKind.JS:
        var privateName = name + '_';
        return function(value) {
          var oldValue = this[privateName];
          if (value !== oldValue) {
            this[privateName] = value;
            if (opt_setHook)
              opt_setHook.call(this, value, oldValue);
            dispatchPropertyChange(this, name, value, oldValue);
          }
        };

      case PropertyKind.ATTR:
        return function(value) {
          var oldValue = this[name];
          if (value !== oldValue) {
            if (value == undefined)
              this.removeAttribute(name);
            else
              this.setAttribute(name, value);
            if (opt_setHook)
              opt_setHook.call(this, value, oldValue);
            dispatchPropertyChange(this, name, value, oldValue);
          }
        };

      case PropertyKind.BOOL_ATTR:
        return function(value) {
          var oldValue = this[name];
          if (value !== oldValue) {
            if (value)
              this.setAttribute(name, name);
            else
              this.removeAttribute(name);
            if (opt_setHook)
              opt_setHook.call(this, value, oldValue);
            dispatchPropertyChange(this, name, value, oldValue);
          }
        };
    }
  }

  /**
   * Defines a property on an object. When the setter changes the value a
   * property change event with the type {@code name + 'Change'} is fired.
   * @param {!Object} obj The object to define the property for.
   * @param {string} name The name of the property.
   * @param {cr.PropertyKind=} opt_kind What kind of underlying storage to use.
   * @param {function(*):void} opt_setHook A function to run after the
   *     property is set, but before the propertyChange event is fired.
   */
  function defineProperty(obj, name, opt_kind, opt_setHook) {
    if (typeof obj == 'function')
      obj = obj.prototype;

    var kind = opt_kind || PropertyKind.JS;

    if (!obj.__lookupGetter__(name)) {
      obj.__defineGetter__(name, getGetter(name, kind));
    }

    if (!obj.__lookupSetter__(name)) {
      obj.__defineSetter__(name, getSetter(name, kind, opt_setHook));
    }
  }

  /**
   * Counter for use with createUid
   */
  var uidCounter = 1;

  /**
   * @return {number} A new unique ID.
   */
  function createUid() {
    return uidCounter++;
  }

  /**
   * Returns a unique ID for the item. This mutates the item so it needs to be
   * an object
   * @param {!Object} item The item to get the unique ID for.
   * @return {number} The unique ID for the item.
   */
  function getUid(item) {
    if (item.hasOwnProperty('uid'))
      return item.uid;
    return item.uid = createUid();
  }

  /**
   * Dispatches a simple event on an event target.
   * @param {!EventTarget} target The event target to dispatch the event on.
   * @param {string} type The type of the event.
   * @param {boolean=} opt_bubbles Whether the event bubbles or not.
   * @param {boolean=} opt_cancelable Whether the default action of the event
   *     can be prevented. Default is true.
   * @return {boolean} If any of the listeners called {@code preventDefault}
   *     during the dispatch this will return false.
   */
  function dispatchSimpleEvent(target, type, opt_bubbles, opt_cancelable) {
    var e = new Event(type, {
      bubbles: opt_bubbles,
      cancelable: opt_cancelable === undefined || opt_cancelable
    });
    return target.dispatchEvent(e);
  }

  /**
   * @param {string} name
   * @param {!Function} fun
   */
  function define(name, fun) {
    var obj = exportPath(name);
    var exports = fun();
    for (var propertyName in exports) {
      // Maybe we should check the prototype chain here? The current usage
      // pattern is always using an object literal so we only care about own
      // properties.
      var propertyDescriptor = Object.getOwnPropertyDescriptor(exports,
                                                               propertyName);
      if (propertyDescriptor)
        Object.defineProperty(obj, propertyName, propertyDescriptor);
    }
  }

  /**
   * Document used for various document related operations.
   * @type {!Document}
   */
  var doc = document;


  /**
   * Allows you to run func in the context of a different document.
   * @param {!Document} document The document to use.
   * @param {function():*} func The function to call.
   */
  function withDoc(document, func) {
    var oldDoc = doc;
    doc = document;
    try {
      func();
    } finally {
      doc = oldDoc;
    }
  }

  /**
   * Adds a {@code getInstance} static method that always return the same
   * instance object.
   * @param {!Function} ctor The constructor for the class to add the static
   *     method to.
   */
  function addSingletonGetter(ctor) {
    ctor.getInstance = function() {
      return ctor.instance_ || (ctor.instance_ = new ctor());
    };
  }

  return {
    addSingletonGetter: addSingletonGetter,
    isChromeOS: isChromeOS,
    isMac: isMac,
    isWindows: isWindows,
    isLinux: isLinux,
    enablePlatformSpecificCSSRules: enablePlatformSpecificCSSRules,
    define: define,
    defineProperty: defineProperty,
    PropertyKind: PropertyKind,
    createUid: createUid,
    getUid: getUid,
    dispatchSimpleEvent: dispatchSimpleEvent,
    dispatchPropertyChange: dispatchPropertyChange,

    /**
     * The document that we are currently using.
     * @type {!Document}
     */
    get doc() {
      return doc;
    },
    withDoc: withDoc
  };
})();
