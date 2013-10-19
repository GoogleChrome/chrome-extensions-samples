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
      application.createControls_().then(function(controls) {
        application.controls = controls;
        application.createNewDocument_().then(function(document) {
          return application;
        });
      });
    });
  },

  /** @private */
  createControls_: function() {
    return Printest.controls.create().then(function(controls) {
      this.addListener(controls, 'createnew', this.createNewDocument_);
      this.addListener(controls, 'printcurrent', this.printCurrentDocument_);
      this.addListener(controls, 'close', this.closeAllDocuments);
    }.bind(this));
  },

  /** @private */
  createNewDocument_: function() {
    var bounds = {bounds: this.getNextDocumentBounds_()};
    return Printest.document.create(bounds).then(function(document) {
      document.addListener(document, 'focus', this.documentWasFocused);
      document.addListener(document, 'close', this.documentWasClosed);
      this.documentWasFocused.call(document);
    }.bind(this));
  },

  /** @private */
  printCurrentDocument_: function() {
    if (this.documents && this.documents.length)
      this.documents[this.documents.length - 1].print();
  },

  /** @private */
  getNextDocumentBounds_: function() {
    // Try with bounds below the controls window, then with bounds below each of
    // the existing document window starting with the most recently focussed
    // one, stopping and using the first bounds that aren't offscreen and don't
    // overlap any existing document window.
    var i, controller, bounds, found = false;
    for (i = this.documents.length; !found && i >= 0; i -= 1) {
      controller = this.documents[i] || this.controls;
      bounds = this.getBoundsBelow_(controller.appWindow.getBounds());
      bounds.height = Printest.document.getSizes().default[1];
      found = this.areBoundsInScreen(bounds, this.controls.domWindow.screen) &&
              !this.doBoundsOverlapDocument(bounds);
    }
    return found ? bounds : undefined;
  },

  /** @private */
  getBoundsBelow_: function(bounds) {
    return {left: bounds.left,
            top: bounds.top + bounds.height + 10,
            width: bounds.width,
            height: bounds.height};
  }
});
