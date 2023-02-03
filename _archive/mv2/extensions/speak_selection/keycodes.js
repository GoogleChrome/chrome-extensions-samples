/**
 * Copyright (c) 2011 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

var KEY_MAP = {
  12: 'Clear',
  14: 'Enter',
  33: 'PgUp',
  34: 'PgDown',
  35: 'End',
  36: 'Home',
  37: 'Left',
  38: 'Up',
  39: 'Right',
  40: 'Down',
  45: 'Insert',
  46: 'Delete',
  96: 'Numpad0',
  97: 'Numpad1',
  98: 'Numpad2',
  99: 'Numpad3',
  100: 'Numpad4',
  101: 'Numpad5',
  102: 'Numpad6',
  103: 'Numpad7',
  104: 'Numpad8',
  105: 'Numpad9',
  106: '*',
  107: 'Plus',
  108: '_',
  109: '-',
  111: '/',
  112: 'F1',
  113: 'F2',
  114: 'F3',
  115: 'F4',
  116: 'F5',
  117: 'F6',
  118: 'F7',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  122: 'F11',
  123: 'F12',
  124: 'F13',
  125: 'F14',
  126: 'F15',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  221: ']'
};

var isMac = (navigator.appVersion.indexOf("Mac") != -1);

function keyEventToString(evt) {
  var tokens = [];
  if (evt.ctrlKey) {
    tokens.push('Control');
  }
  if (evt.altKey) {
    tokens.push(isMac ? 'Option' : 'Alt');
  }
  if (evt.metaKey) {
    tokens.push(isMac ? 'Command' : 'Meta');
  }
  if (evt.shiftKey) {
    tokens.push('Shift');
  }
  if (evt.keyCode >= 48 && evt.keyCode <= 90) {
    tokens.push(String.fromCharCode(evt.keyCode));
  } else if (KEY_MAP[evt.keyCode]) {
    tokens.push(KEY_MAP[evt.keyCode]);
        } else {
    return '';
        }
  return tokens.join('+');
}

function getDefaultKeyString() {
  return keyEventToString({
    keyCode: 83,  // 's'
    shiftKey: true,
    altKey: true,
    ctrlKey: true,
    metaKey: false});
}
