// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * States that the extension can be in.
 */
let StateEnum = {
  DISABLED: 'disabled',
  DISPLAY: 'display',
  SYSTEM: 'system'
};

/**
 * Key used for storing the current state in {localStorage}.
 */
let STATE_KEY = 'state';

/**
 * Loads the locally-saved state asynchronously.
 * @param {function} callback Callback invoked with the loaded {StateEnum}.
 */
function loadSavedState(callback) {
  chrome.storage.local.get(STATE_KEY, function (items) {
    let savedState = items[STATE_KEY];
    for (let key in StateEnum) {
      if (savedState == StateEnum[key]) {
        callback(savedState);
        return;
      }
    }
    callback(StateEnum.DISABLED);
  });
}

/**
 * Switches to a new state.
 * @param {string} newState New {StateEnum} to use.
 */
function setState(newState) {
  let imagePrefix = 'night';
  let title = '';

  switch (newState) {
    case StateEnum.DISABLED:
      chrome.power.releaseKeepAwake();
      imagePrefix = 'night';
      title = chrome.i18n.getMessage('disabledTitle');
      break;
    case StateEnum.DISPLAY:
      chrome.power.requestKeepAwake('display');
      imagePrefix = 'day';
      title = chrome.i18n.getMessage('displayTitle');
      break;
    case StateEnum.SYSTEM:
      chrome.power.requestKeepAwake('system');
      imagePrefix = 'sunset';
      title = chrome.i18n.getMessage('systemTitle');
      break;
    default:
      throw 'Invalid state "' + newState + '"';
  }

  let items = {};
  items[STATE_KEY] = newState;
  chrome.storage.local.set(items);

  chrome.action.setIcon({
    path: {
      19: 'images/' + imagePrefix + '-19.png',
      38: 'images/' + imagePrefix + '-38.png'
    }
  });
  chrome.action.setTitle({ title: title });
}

chrome.action.onClicked.addListener(function () {
  loadSavedState(function (state) {
    switch (state) {
      case StateEnum.DISABLED:
        setState(StateEnum.DISPLAY);
        break;
      case StateEnum.DISPLAY:
        setState(StateEnum.SYSTEM);
        break;
      case StateEnum.SYSTEM:
        setState(StateEnum.DISABLED);
        break;
      default:
        throw 'Invalid state "' + state + '"';
    }
  });
});

chrome.runtime.onStartup.addListener(function () {
  loadSavedState(function (state) {
    setState(state);
  });
});
