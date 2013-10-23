/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

"use strict";

var Printest = Printest || A.object.create({});

Printest.application = A.object.create.call(A.application, {

  create: function() {
    return A.application.create.call(this).then(function(application) {
      return application.getSettings_().then(function(settings) {
        return settings.bounds || application.getDefaultControlBounds_();
      }).then(function(bounds) {
        return application.createControls_(bounds);
      }).then(function(controls) {
        application.controls = controls;
        return application.createNewDocument_();
      }).then(function(document) {
        return application;
      });
    });
  },

  documentWasFocused: function() {
    var application = Printest.application.instance;
    A.application.documentWasFocused.apply(this, arguments);
    application.controls.documentsChanged(application.documents);
  },

  documentWasClosed: function() {
    var application = Printest.application.instance;
    A.application.documentWasClosed.apply(this, arguments);
    application.controls.documentsChanged(application.documents);
  },

  /** @private */
  getSettings_: function() {
    var promise = A.promise.create();
    chrome.storage.sync.get('settings', function(items) {
      promise.fulfill(items.settings || {});
    });
    return promise;
  },

  /** @private */
  getDefaultControlBounds_: function() {
    var promise = A.promise.create();
    // chrome.system.display.getInfo is stubbed for <http://crbug.com/310289>.
    this.chromeSystemDisplayGetInfoStub_(function(displays) {
      displays.forEach(function(display) {
        if (display.isPrimary)
          promise.fulfill(this.getCenteredControlBounds_(display.workArea));
      }, this);
    }.bind(this));
    return promise;
  },

  /** @private */
  chromeSystemDisplayGetInfoStub_: function(callback) {
    callback.call(this, [{isPrimary: true,
                          workArea: {left: 0, top: 0,
                                     width: 1024, height: 768}}]);
  },

  /** @private */
  getCenteredControlBounds_: function(area) {
    var width = Printest.document.getSizes().default[0];
    var height = Printest.controls.getSizes().default[1];
    var center = this.getCenteredBounds(area, width, height);
    return {left: center.left,
            top: center.top - Printest.document.getSizes().default[1],
            width: width,
            height: height};
  },

  /** @private */
  createControls_: function(bounds) {
    return Printest.controls.create({bounds: bounds}).then(function(controls) {
      this.addListener(controls, 'createnew', this.createNewDocument_);
      this.addListener(controls, 'printcurrent', this.printCurrentDocument_);
      this.addListener(controls, 'windowclosed', this.closeAllDocuments);
      this.addListener(controls, 'boundschanged', this.saveSettings_);
    }.bind(this));
  },

  /** @private */
  createNewDocument_: function() {
    var properties = {bounds: this.getNextDocumentBounds_()};
    return Printest.document.create(properties).then(function(document) {
      document.addListener(document, 'windowfocused', this.documentWasFocused);
      document.addListener(document, 'windowclosed', this.documentWasClosed);
      this.documentWasFocused.call(document);
    }.bind(this));
  },

  /** @private */
  printCurrentDocument_: function() {
    if (this.documents && this.documents.length)
      this.documents[this.documents.length - 1].print();
  },

  /** @private */
  saveSettings_: function() {
    if (!this.settingsTimeout_) {
      this.settingsTimeout_ = window.setTimeout(function() {
        var bounds = this.controls.getInnerBounds();
        chrome.storage.sync.set({settings: {bounds: bounds}});
        delete this.settingsTimeout_;
      }.bind(this), 0);
    }
  },

  /** @private */
  getNextDocumentBounds_: function() {
    // Try with bounds below the controls window, then with bounds below each of
    // the existing document window starting with the most recently focussed
    // one, stopping and using the first bounds that aren't offscreen and don't
    // overlap any existing document window. All bounds here are inner bounds.
    var i, controller, bounds, found = false;
    for (i = this.documents.length; !found && i >= 0; i -= 1) {
      bounds = this.getBoundsBelow_(this.documents[i] || this.controls);
      bounds.height = Printest.document.getSizes().default[1];
      found = this.areBoundsInSameScreen(bounds, this.controls) &&
              !this.doBoundsOverlapDocument(bounds);
    }
    return found ? bounds : undefined;
  },

  /** @private */
  getBoundsBelow_: function(controller) {
    var bounds = controller.getInnerBounds();
    var offset = bounds.height + controller.getFrameSize().height + 10;
    return {left: bounds.left, top: bounds.top + offset,
            width: bounds.width, height: bounds.height};
  }
});
