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

import { DURATION_FOR_EVER, getSavedMode, StateEnum } from './common.js';

/** @typedef {import('./common.js').KeepAwakeMode} KeepAwakeMode */

/** @type {HTMLLabelElement} */
let durationLabel;
/** @type {HTMLInputElement} */
let durationSlider;

/**
 * Get an HTML element by selector and asserts not null.
 * @param {string} query
 * @return {HTMLElement}
 */
function querySelectorAndAssert(query) {
  const e = document.querySelector(query);
  if (!e) {
    throw new Error('unable to get element with query: ' + query);
  }
  return /** @type {HTMLElement} */ (e);
}

/**
 * Updates the label for the duration slider.
 */
function updateDurationLabel() {
  durationLabel.textContent =
    (durationSlider.value === DURATION_FOR_EVER.toString()
      ? '∞'
      : durationSlider.value) +
    ' ' +
    chrome.i18n.getMessage('autoDisableHoursSuffix');
}

/**
 * Called when the duration slider is changed
 *
 * Sends a message to the background service worker to set the new state
 * and duration.
 */
async function durationSliderChanged() {
  updateDurationLabel();

  const newState = await sendMessageToBackground(
    (await getSavedMode()).state,
    Number(durationSlider.value)
  );
  updateState(newState);
}

/**
 * Sends a message to the background service worker to set the new state and
 * duration.
 *
 * @param {string} state
 * @param {number} duration
 * @return {Promise<KeepAwakeMode>} Updated mode
 */
async function sendMessageToBackground(state, duration) {
  if (!Object.values(StateEnum).includes(state)) {
    throw new Error('invalid State: ' + state);
  }

  const message = { state: state };
  if (duration < 1 || duration >= DURATION_FOR_EVER) {
    // no timeout
    message.duration = null;
  } else {
    message.duration = duration;
  }
  return await chrome.runtime.sendMessage(message);
}

/**
 * Called when one of the keepalive buttons is clicked.
 *
 * Sends a message to the background service worker to set the new state
 * and duration.
 *
 * @param {MouseEvent} e
 */
async function buttonClicked(e) {
  const button = /** @type {HTMLElement} */ (e.currentTarget);
  const newState = await sendMessageToBackground(
    // Button id is named after state.
    button.id,
    Number(durationSlider.value)
  );
  updateState(newState);
}

/**
 * @param {KeepAwakeMode} newMode
 */

function updateState(newMode) {
  console.log('new state: %o', newMode);
  if (!newMode) {
    throw new Error('invalid null state');
  }
  // Re-set active button state.
  document.querySelector(`#buttons .active`)?.classList?.remove('active');
  querySelectorAndAssert(`#buttons #${newMode.state}`).classList?.add('active');
  if (newMode.state === StateEnum.DISABLED || !newMode.endMillis) {
    querySelectorAndAssert('#autodisable-text').textContent =
      chrome.i18n.getMessage('autoDisableAfterText');
  } else {
    querySelectorAndAssert('#autodisable-text').textContent =
      chrome.i18n.getMessage('autoDisableAtText') +
      new Date(newMode.endMillis).toLocaleTimeString(undefined, {
        timeStyle: 'short'
      });
  }
  updateDurationLabel();
}

/**
 * Run when document is loaded.
 *
 * Initializes the popup, and sets I18n labels.
 */
async function onload() {
  durationSlider = /** @type {HTMLInputElement} */ (
    querySelectorAndAssert('#durationSlider')
  );
  durationLabel = /** @type {HTMLLabelElement} */ (
    querySelectorAndAssert('#durationLabel')
  );

  querySelectorAndAssert('#title').textContent =
    chrome.i18n.getMessage('extensionName');

  const mode = await getSavedMode();

  // set button titles and listeners
  for (const id of Object.values(StateEnum)) {
    const button = querySelectorAndAssert(`#buttons #${id}`);
    button.addEventListener('click', buttonClicked);
    button.title = chrome.i18n.getMessage(button.id + 'Title');
    querySelectorAndAssert(`#buttons #${id} .buttonLabel`).textContent =
      chrome.i18n.getMessage(button.id + 'Label');
  }

  durationSlider.max = DURATION_FOR_EVER.toString();
  durationSlider.value = (
    mode.defaultDurationHrs ? mode.defaultDurationHrs : DURATION_FOR_EVER
  ).toString();
  durationSlider.addEventListener('input', durationSliderChanged);
  updateState(mode);
}

document.addEventListener('DOMContentLoaded', onload);
