// Copyright 2026 Google LLC
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

const GET_REPLACEMENTS_MESSAGE_ID = 'get-replacements';
const SET_REPLACEMENTS_MESSAGE_ID = 'set-replacements';

const form = document.querySelector('form');

// Ask the background for replacement patterns and initialize the page
chrome.runtime.sendMessage({id: GET_REPLACEMENTS_MESSAGE_ID})
  .then(data => loadFormData(data.patterns));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveFormData();

  let currentTab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: {tabId: currentTab.id},
    files: ['content.js']
  });
});

document.getElementById('reset').addEventListener('click', (event) => {
  // <input type="reset"> automatically reset the form's contents, but those
  // changes won't settle until the the next turn of the event loop. Since
  // saveFormData works directly gainst DOM, we have to call it after a minimal
  // delay.
  setTimeout(saveFormData, 0);
});

form.addEventListener('input', debounce(saveFormData, 250));

/**
 * Populate the form with values from persistent storage.
 */
function loadFormData(patterns) {
  const inputs = form.querySelectorAll('input[type=text]');
  const flatPatterns = patterns.flat();

  inputs.forEach((input, index) => {
    input.value = flatPatterns[index] || '';
  });
}

/**
 * Write the form values to persistent storage.
 */
function saveFormData() {
  const inputs = form.querySelectorAll('input[type=text]');

  const patterns = [...inputs].reduce((acc, input, index) => {
    const outerIndex = Math.floor(index / 2);
    const innerIndex = index % 2;

    if (innerIndex === 0) {
      // Set the "find" value
      acc[outerIndex] = [input.value, ''];
    } else {
      // Set the "replace" value
      acc[outerIndex][innerIndex] = input.value;
    }

    return acc;
  }, []);

  // Ask the background to persist this data
  chrome.runtime.sendMessage({
    id: SET_REPLACEMENTS_MESSAGE_ID,
    data: patterns,
  });
}

/**
 * Limits how often the supplied callback function will be called.
 *
 * @see https://developers.google.com/web/fundamentals/performance/rendering/debounce-your-input-handlers
 *
 * @param {function} fn Callback function that you want to debounce.
 * @param {number} wait The amount of time to wait before calling the function.
 */
function debounce(fn, wait = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn.apply(this, args);
    }, wait);
  }
}

/**
 * Fetch the currently active tab.
 *
 * @returns chrome.tabs.Tab instance
 */
async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
