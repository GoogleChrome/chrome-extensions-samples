/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

"use strict";

var Printest = Printest || {};

Printest.document = A.object.create.call(A.controller, {
  // The minimum window size set below allow the print preview panel to be large
  // enough to be usable (even before http://crbug.com/307839 is fixed).
  url: 'document.html',
  frame: 'chrome',
  sizes: {minimum: [438, 219], default: [438, 219]},

  create: function(properties) {
    return A.controller.create.apply(this, arguments).then(function(document) {
      document.queryElement('#from').textContent = document.from = 1;
      document.queryElement('#to').textContent = document.to = 99;
      document.addListener('#print', 'click', document.print);
      document.addListener(document, 'windowresized', document.onResize_);
      document.onResize_();
      return document.createPrintout_();
    }).then(function(printout) {
      printout.document.printout = printout;
      return printout.document;
    });
  },

  print: function() {
    this.printout.printNumbers(this.from, this.to);
  },

  /** @private */
  createPrintout_: function() {
    return Printest.printout.create({
      domWindow: this.domWindow.frames['print'],
      document: this
    });
  },

  /** @private */
  onResize_: function() {
    var height = this.queryElement('#fill-footer').scrollHeight;
    this.queryElement('#fill-contents').style.bottom = height + 'px';
  }
});
