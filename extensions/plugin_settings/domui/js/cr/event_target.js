// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This contains an implementation of the EventTarget interface
 * as defined by DOM Level 2 Events.
 */

cr.define('cr', function() {

  /**
   * Creates a new EventTarget. This class implements the DOM level 2
   * EventTarget interface and can be used wherever those are used.
   * @constructor
   */
  function EventTarget() {
  }

  EventTarget.prototype = {

    /**
     * Adds an event listener to the target.
     * @param {string} type The name of the event.
     * @param {!Function|{handleEvent:Function}} handler The handler for the
     *     event. This is called when the event is dispatched.
     */
    addEventListener: function(type, handler) {
      if (!this.listeners_)
        this.listeners_ = Object.create(null);
      if (!(type in this.listeners_)) {
        this.listeners_[type] = [handler];
      } else {
        var handlers = this.listeners_[type];
        if (handlers.indexOf(handler) < 0)
          handlers.push(handler);
      }
    },

    /**
     * Removes an event listener from the target.
     * @param {string} type The name of the event.
     * @param {!Function|{handleEvent:Function}} handler The handler for the
     *     event.
     */
    removeEventListener: function(type, handler) {
      if (!this.listeners_)
        return;
      if (type in this.listeners_) {
        var handlers = this.listeners_[type];
        var index = handlers.indexOf(handler);
        if (index >= 0) {
          // Clean up if this was the last listener.
          if (handlers.length == 1)
            delete this.listeners_[type];
          else
            handlers.splice(index, 1);
        }
      }
    },

    /**
     * Dispatches an event and calls all the listeners that are listening to
     * the type of the event.
     * @param {!cr.event.Event} event The event to dispatch.
     * @return {boolean} Whether the default action was prevented. If someone
     *     calls preventDefault on the event object then this returns false.
     */
    dispatchEvent: function(event) {
      if (!this.listeners_)
        return true;

      // Since we are using DOM Event objects we need to override some of the
      // properties and methods so that we can emulate this correctly.
      var self = this;
      event.__defineGetter__('target', function() {
        return self;
      });
      event.preventDefault = function() {
        this.returnValue = false;
      };

      var type = event.type;
      var prevented = 0;
      if (type in this.listeners_) {
        // Clone to prevent removal during dispatch
        var handlers = this.listeners_[type].concat();
        for (var i = 0, handler; handler = handlers[i]; i++) {
          if (handler.handleEvent)
            prevented |= handler.handleEvent.call(handler, event) === false;
          else
            prevented |= handler.call(this, event) === false;
        }
      }

      return !prevented && event.returnValue;
    }
  };

  // Export
  return {
    EventTarget: EventTarget
  };
});
