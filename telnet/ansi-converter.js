/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Boris Smus (smus@chromium.org)
*/

(function(exports) {
  var COLOR_TABLE = {
    0: 'black',
    1: 'red',
    2: 'green',
    3: 'yellow',
    4: 'blue',
    5: 'magenta',
    6: 'cyan',
    7: 'white'
  };

  var ANSI_ESC = String.fromCharCode(0x1B);
  var ANSI_CODE_REGEX = new RegExp(ANSI_ESC + '\\[(.+?)m', 'g');

  function A() {
  }

  /**
   * Given an ANSI string, format it in HTML.
   *
   * @param {String} ansiString The string to format
   */
  A.prototype.formatAnsi = function(ansiString) {
    var out = ansiString;
    // Remove all of the control characters.
    out = out.replace(new RegExp(String.fromCharCode(65533), 'g'), '');
    // Replace every space with a nbsp.
    out = out.replace(/ /g, '&nbsp;');
    // Replace every ANSI code in the string with the appropriate span.
    out = out.replace(ANSI_CODE_REGEX, this._replaceCodeWithHTML);
    return out;
  };

  /**
   * Replaces an ANSI Code in the string
   * with a span-wrapped version. Used as
   * a callback in the formatAnsi function
   *
   * @param {String} matched The substring that matched
   * @param {String} ansiString The actual matched string
   * @param {Number} index The offset of the match within the overall string
   * @param {String} s The overall string
   */
  A.prototype._replaceCodeWithHTML = function(matched, ansiString, index, s) {
    // Extract the ansiCode from the string.
    var split = ansiString.split(';');
    var ansiCode = parseInt(split[split.length - 1], 10);
    // Convert code to color code.
    var colorCode = ansiCode - 30;
    // Lookup the corresponding style.
    var style = 'color: ' + COLOR_TABLE[colorCode];
    return '<span style="' + style + ';">';
  };

  exports.AnsiConverter = A;
})(window);
