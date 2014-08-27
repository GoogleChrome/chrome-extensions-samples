/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

"use strict";

var Printest = Printest || {};

Printest.printout = A.object.create.call(A.controller, {
  url: 'printout.html',
  size: [240, 100],

  printNumbers: function(from, to) {
    this.removeAllChildren();
    this.appendNumbers_(from, to);
    this.domWindow.print();
  },

  /** @private */
  appendNumbers_: function(from, to) {
    var i;
    for (i = from; i <= to; ++i)
      this.appendChild(this.createDiv(this.spellNumber_(i)));
  },

  /** @private */
  spellNumber_: function(number) {
    return (number < 20) ? this.spellUnits_(number) :
           (number < 100) ? this.spellTens_(number) :
           (number < 1000) ? this.spellHundreds_(number) :
           this.spellThousands_(number);
  },

  /** @private */
  spellThousands_: function(number) {
    // We ignore millions, billions, trillions, etc...
    var separator = (number % 1000) ? ' thousand ' : ' thousand';
    var suffix = (number % 1000) ? this.spellNumber_(number % 1000) : '';
    return this.spellNumber_(Math.floor(number / 1000)) + separator + suffix;
  },

  /** @private */
  spellHundreds_: function(number) {
    var separator = (number % 100) ? ' hundred ' : ' hundred';
    var suffix = (number % 100) ? this.spellNumber_(number % 100) : '';
    return this.spellNumber_(Math.floor(number / 100)) + separator + suffix;
  },

  /** @private */
  spellTens_: function(number) {
    var separator = (number % 10) ? ' ' : '';
    var suffix = (number % 10) ? this.spellUnits_(number % 10) : '';
    return (number >= 90) ? 'ninety' + separator + suffix :
           (number >= 80) ? 'eighty' + separator + suffix :
           (number >= 70) ? 'seventy' + separator + suffix :
           (number >= 60) ? 'sixty' + separator + suffix :
           (number >= 50) ? 'fifty' + separator + suffix :
           (number >= 40) ? 'forty' + separator + suffix :
           (number >= 30) ? 'thirty' + separator + suffix :
                            'twenty' + separator + suffix;
  },

  /** @private */
  spellUnits_: function(number) {
    return (number >= 19) ? 'nineteen' :
           (number >= 18) ? 'eighteen' :
           (number >= 17) ? 'seventeen' :
           (number >= 16) ? 'sixteen' :
           (number >= 15) ? 'fifteen' :
           (number >= 14) ? 'fourteen' :
           (number >= 13) ? 'thirteen' :
           (number >= 12) ? 'twelve' :
           (number >= 11) ? 'eleven' :
           (number >= 10) ? 'ten' :
           (number >= 9) ? 'nine' :
           (number >= 8) ? 'eight' :
           (number >= 7) ? 'seven' :
           (number >= 6) ? 'six' :
           (number >= 5) ? 'five' :
           (number >= 4) ? 'four' :
           (number >= 3) ? 'three' :
           (number >= 2) ? 'two' :
           (number >= 1) ? 'one' :
                           'zero';
  }
});
