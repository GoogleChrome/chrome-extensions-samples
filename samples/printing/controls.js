/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

"use strict";

var Printest = Printest || {};

Printest.controls = A.object.create.call(A.controller, {
  url: 'controls.html',
  frame: 'chrome',
  sizes: {minimum: [184, 103], default: [184, 103], maximum: [999999, 103]},

  create: function(properties) {
    // Make the width the same as a document window so things will look nice
    // when document windows are created below the controls window.
    var width = Printest.document.sizes.default[0];
    this.sizes.minimum[0] = this.sizes.default[0] = width;

    return A.controller.create.apply(this, arguments).then(function (view) {
      view.animation = view.queryElement('#animation');
      view.checkbox = view.queryElement('#animation input');
      view.addListener('#animation input', 'click', view.toggleAnimation_);
      view.addListener('#create-new', 'click', 'createnew');
      view.addListener('#print-current', 'click', 'printcurrent');
    });
  },

  documentsChanged: function(documents) {
    this.queryElement('#print-current').disabled = (documents.length == 0);
  },

  /** @private */
  // The animation created here serves to demonstrate that setInterval() and
  // setTimeout() timers are paused while the print preview dialog is open.
  toggleAnimation_: function(event) {
    this.animated = !this.animated;
    this.checkbox.checked = this.animated;
    if (this.animated) {
      this.animation.dataset.state = 1;
      this.timerId = this.domWindow.setInterval(function() {
        if (this.animated) {
          this.animation.dataset.state = (this.animation.dataset.state % 9) + 1;
        } else {
          this.domWindow.clearInterval(this.timerId);
          delete this.animation.dataset.state;
        }
      }.bind(this), 1 / 9 * 1000);
    }
  }
});
