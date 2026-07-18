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

export const DURATION_FOR_EVER = 13;

/**
 * States that the extension can be in.
 * @readonly
 * @enum {string}
 */
export const StateEnum = {
  DISABLED: 'disabled',
  DISPLAY: 'display',
  SYSTEM: 'system'
};

/**
 * @typedef {{
 *  state: StateEnum;
 *  defaultDurationHrs: number?;
 *  endMillis: number | null | undefined;
 * }} KeepAwakeMode
 */

/**
 * Key used for storing the current state in {localStorage}.
 * @type {KeepAwakeMode}
 */
const DEFAULT_MODE = {
  state: StateEnum.DISABLED,
  defaultDurationHrs: null, // no timeout.
  endMillis: null
};

/**
 * Gets the saved Keep Awake mode from local storage
 * @return {Promise<KeepAwakeMode>}
 */
export async function getSavedMode() {
  let mode = await chrome.storage.local.get(DEFAULT_MODE);
  return verifyMode(mode);
}

/**
 * Validates the values of the keepawake mode
 *
 * @param {*} mode
 * @return {KeepAwakeMode}
 */
export function verifyMode(mode) {
  if (!Object.values(StateEnum).includes(mode.state)) {
    mode.state = DEFAULT_MODE.state;
  }
  mode.defaultDurationHrs = Number(mode.defaultDurationHrs);
  if (
    mode.defaultDurationHrs < 1 ||
    mode.defaultDurationHrs >= DURATION_FOR_EVER
  ) {
    mode.defaultDurationHrs = null; // no timeout.
  }
  return mode;
}
