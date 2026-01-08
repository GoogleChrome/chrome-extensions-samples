// @ts-check

// Copyright 2024 Google LLC
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

import { StateEnum, getSavedMode, verifyMode } from './common.js';
/** @typedef {import('./common.js').KeepAwakeMode} KeepAwakeMode */

const ALARM_NAME = 'keepAwakeTimeout';
const HOUR_TO_MILLIS = 60 * 60 * 1000;
const USE_POPUP_DEFAULT = { usePopup: true };

/**
 * Simple timestamped log function
 * @param {string} msg
 * @param {...*} args
 */
function log(msg, ...args) {
  console.log(new Date().toLocaleTimeString('short') + ' ' + msg, ...args);
}

/**
 * Set keep awake mode, and update icon.
 *
 * @param {KeepAwakeMode} mode
 */
function updateState(mode) {
  let imagePrefix;
  let title;

  switch (mode.state) {
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
      throw 'Invalid state "' + mode.state + '"';
  }

  chrome.action.setIcon({
    path: {
      19: 'images/' + imagePrefix + '-19.png',
      38: 'images/' + imagePrefix + '-38.png'
    }
  });

  if (mode.endMillis && mode.state != StateEnum.DISABLED) {
    // a timeout is specified, update the badge and the title text
    let hoursLeft = Math.ceil((mode.endMillis - Date.now()) / HOUR_TO_MILLIS);
    chrome.action.setBadgeText({ text: `${hoursLeft}h` });
    const endDate = new Date(mode.endMillis);
    chrome.action.setTitle({
      title: `${title}${chrome.i18n.getMessage('untilText')} ${endDate.toLocaleTimeString(undefined, { timeStyle: 'short' })}`
    });
    log(
      `mode = ${mode.state} for the next ${hoursLeft}hrs until ${endDate.toLocaleTimeString()}`
    );
  } else {
    // No timeout.
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: title });
    log(`mode = ${mode.state}`);
  }
}

/**
 *
 * Apply a new KeepAwake mode.
 *
 * @param {KeepAwakeMode} newMode
 * @return {Promise<KeepAwakeMode>}
 */
async function setNewMode(newMode) {
  // Clear any old alarms
  await chrome.alarms.clearAll();

  // is a timeout required?
  if (newMode.defaultDurationHrs && newMode.state !== StateEnum.DISABLED) {
    // Set an alarm every 60 mins.
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: 60,
      periodInMinutes: 60
    });
    newMode.endMillis =
      Date.now() + newMode.defaultDurationHrs * HOUR_TO_MILLIS;
  } else {
    newMode.endMillis = null;
  }

  // Store the new mode.
  chrome.storage.local.set(newMode);
  updateState(newMode);
  return newMode;
}

/**
 * Check to see if any set timeout has expired, and if so, reset the mode.
 */
async function checkTimeoutAndUpdateDisplay() {
  const mode = await getSavedMode();
  if (mode.endMillis && mode.endMillis < Date.now()) {
    log(`timer expired`);
    // reset state to disabled
    mode.state = StateEnum.DISABLED;
    mode.endMillis = null;
    setNewMode(mode);
  } else {
    updateState(mode);
  }
}

async function recreateAlarms() {
  const mode = await getSavedMode();
  await chrome.alarms.clearAll();
  if (
    mode.state !== StateEnum.DISABLED &&
    mode.endMillis &&
    mode.endMillis > Date.now()
  ) {
    // previous timeout has not yet expired...
    // restart alarm to be triggered at the next 1hr of the timeout
    const remainingMillis = mode.endMillis - Date.now();
    const millisToNextHour = remainingMillis % HOUR_TO_MILLIS;

    log(
      `recreating alarm, next = ${new Date(Date.now() + millisToNextHour).toLocaleTimeString()}`
    );
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: millisToNextHour / 60_000,
      periodInMinutes: 60
    });
  }
}

/**
 * Creates the context menu buttons on the action icon.
 */
async function reCreateContextMenus() {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    type: 'normal',
    id: 'openStateMenu',
    title: chrome.i18n.getMessage('openStateWindowMenuTitle'),
    contexts: ['action']
  });
  chrome.contextMenus.create({
    type: 'checkbox',
    checked: USE_POPUP_DEFAULT.usePopup,
    id: 'usePopupMenu',
    title: chrome.i18n.getMessage('usePopupMenuTitle'),
    contexts: ['action']
  });

  updateUsePopupMenu(
    (await chrome.storage.sync.get(USE_POPUP_DEFAULT)).usePopup
  );
}

/**
 * Sets whether or not to use the popup menu when clicking on the action icon.
 *
 * @param {boolean} usePopup
 */
function updateUsePopupMenu(usePopup) {
  chrome.contextMenus.update('usePopupMenu', { checked: usePopup });
  if (usePopup) {
    chrome.action.setPopup({ popup: 'popup.html' });
  } else {
    chrome.action.setPopup({ popup: '' });
  }
}

// Handle messages received from the popup.
chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
  log(
    `Got message from popup: state: %s, duration: %d`,
    request.state,
    request.duration
  );

  setNewMode(
    verifyMode({
      state: request.state,
      defaultDurationHrs: request.duration,
      endMillis: null
    })
  )
    .then((newMode) => sendResponse(newMode))
    .catch((e) => {
      log(`failed to set new mode: ${e}`, e);
      sendResponse(null);
    });
  return true; // sendResponse() called asynchronously
});

// Handle action clicks - rotates the mode to the next mode.
chrome.action.onClicked.addListener(async () => {
  log(`Action clicked`);

  const mode = await getSavedMode();
  switch (mode.state) {
    case StateEnum.DISABLED:
      mode.state = StateEnum.DISPLAY;
      break;
    case StateEnum.DISPLAY:
      mode.state = StateEnum.SYSTEM;
      break;
    case StateEnum.SYSTEM:
      mode.state = StateEnum.DISABLED;
      break;
    default:
      throw 'Invalid state "' + mode.state + '"';
  }
  setNewMode(mode);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (e) => {
  switch (e.menuItemId) {
    case 'openStateMenu':
      chrome.windows.create({
        focused: true,
        height: 220,
        width: 240,
        type: 'popup',
        url: './popup.html'
      });
      break;

    case 'usePopupMenu':
      // e.checked is new state, after being clicked.
      chrome.storage.sync.set({ usePopup: !!e.checked });
      updateUsePopupMenu(!!e.checked);
      break;
  }
});

// Whenever the alarm is triggered check the timeout and update the icon.
chrome.alarms.onAlarm.addListener(() => {
  log('alarm!');
  checkTimeoutAndUpdateDisplay();
});

chrome.runtime.onStartup.addListener(async () => {
  log('onStartup');
  recreateAlarms();
  reCreateContextMenus();
});

chrome.runtime.onInstalled.addListener(async () => {
  log('onInstalled');
  recreateAlarms();
  reCreateContextMenus();
});

chrome.storage.sync.onChanged.addListener((changes) => {
  if (changes.usePopup != null) {
    log('usePopup changed to %s', changes.usePopup.newValue);
    updateUsePopupMenu(!!changes.usePopup.newValue);
  }
});

// Whenever the service worker starts up, check the timeout and update the state
checkTimeoutAndUpdateDisplay();
