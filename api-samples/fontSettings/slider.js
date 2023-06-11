// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// Ported from MV2 samples. Some coding practices are non-standard in MV3, but the sample remains a robust demonstration of the chrome.fontsettings API.

'use strict';

/**
 * @fileoverview A Slider control. Based on Chromium's MediaControls.Slider.
 */

/**
 * Creates a slider control.
 *
 * @param {HTMLElement} container The containing div element.
 * @param {number} value Initial value
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {?function(number)=} opt_onChange Value change handler
 * @constructor
 */
function Slider(container, value, min, max, opt_onChange) {
  this.container_ = container;
  this.onChange_ = opt_onChange;

  let containerDocument = this.container_.ownerDocument;

  this.container_.classList.add('slider');

  this.input_ = containerDocument.createElement('input');
  this.input_.type = 'range';
  this.input_.min = min;
  this.input_.max = max;
  this.input_.value = value;
  this.container_.appendChild(this.input_);

  this.input_.addEventListener('change', this.onInputChange_.bind(this));
  this.input_.addEventListener('input', this.onInputChange_.bind(this));

  this.bar_ = containerDocument.createElement('div');
  this.bar_.className = 'bar';
  this.container_.appendChild(this.bar_);

  this.filled_ = containerDocument.createElement('div');
  this.filled_.className = 'filled';
  this.bar_.appendChild(this.filled_);

  let leftCap = containerDocument.createElement('div');
  leftCap.className = 'cap left';
  this.bar_.appendChild(leftCap);

  let rightCap = containerDocument.createElement('div');
  rightCap.className = 'cap right';
  this.bar_.appendChild(rightCap);

  this.updateFilledWidth_();
}

/**
 * @return {number} The value of the input control.
 */
Slider.prototype.getValue = function () {
  return this.input_.value;
};

/**
 * @param{number} value The value to set the input control to.
 */
Slider.prototype.setValue = function (value) {
  this.input_.value = value;
  this.updateFilledWidth_();
};

/**
 * @return {HTMLInputElement} The underlying input control.
 */
Slider.prototype.getInput = function () {
  return this.input_;
};

/**
 * Updates the filled portion of the slider to reflect the slider's current
 * value.
 * @private
 */
Slider.prototype.updateFilledWidth_ = function () {
  let proportion =
    (this.input_.value - this.input_.min) / (this.input_.max - this.input_.min);
  this.filled_.style.width = proportion * 100 + '%';
};

/**
 * Called when the slider's value changes.
 * @private
 */
Slider.prototype.onInputChange_ = function () {
  this.updateFilledWidth_();
  if (this.onChange_) this.onChange_(this.input_.value);
};
