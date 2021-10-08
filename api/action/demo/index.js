// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

/**
 * @param {number} timeout
 * @param {(event: Event) => void} callback
 * @return {(event: Event) => void}
 */
function debounce(timeout, callback) {
  let timeoutID = 0;
  return (event) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => callback(event), timeout);
  };
}

// ------------------
// .enable / .disable
// ------------------

// The action API does not expose a way to read the action's current enabled/disabled state, so we
// have to track it ourselves.
// Relevant feature request: https://bugs.chromium.org/p/chromium/issues/detail?id=1189295
let actionEnabled = true;
let showToggleState = document.getElementById('show-toggle-state');
document.getElementById('toggle-state-button').addEventListener('click', (_event) => {
  if (actionEnabled) {
    chrome.action.disable();
  } else {
    chrome.action.enable();
  }
  actionEnabled = !actionEnabled;
});

document.getElementById('popup-options').addEventListener('change', async (event) => {
  let popup = event.target.value;
  await chrome.action.setPopup({ popup });

  // Show the updated popup path
  await getCurrentPopup();
});

async function getCurrentPopup() {
  let popup = await chrome.action.getPopup({});
  document.getElementById('current-popup-value').value = popup;
  return popup;
};

async function showCurrentPage() {
  let popup = await getCurrentPopup();
  let pathname = '';
  if (popup) {
    pathname = new URL(popup).pathname;
  }

  let options = document.getElementById('popup-options');
  let option = options.querySelector(`option[value="${pathname}"]`);
  option.selected = true;
}

// Populate popup inputs on on page load
showCurrentPage();

// ----------
// .onClicked
// ----------

// If a popup is specified, our on click handler won't be called. We declare it here rather than in
// the `onclicked-button` handler to prevent the user from accidentally registering multiple
// onClicked listeners.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'https://html5zombo.com/' });
});

document.getElementById('onclicked-button').addEventListener('click', async () => {
  // Our listener will only receive the action's click event after clear out the popup URL
  await chrome.action.setPopup({ popup: '' });
  await showCurrentPage();
});

document.getElementById('onclicked-reset-button').addEventListener('click', async () => {
  await chrome.action.setPopup({ popup: 'popups/popup.html' });
  await showCurrentPage();
});

// ----------
// badge text
// ----------

async function showBadgeText() {
  let text = await chrome.action.getBadgeText({});
  document.getElementById('current-badge-text').value = text;
}

// Populate badge text inputs on on page load
showBadgeText();

document.getElementById('badge-text-input').addEventListener('input', async (event) => {
  let text = event.target.value;
  await chrome.action.setBadgeText({ text });

  showBadgeText();
});

document.getElementById('clear-badge-button').addEventListener('click', async () => {
  await chrome.action.setBadgeText({ text: '' });

  showBadgeText();
});

// ----------------------
// badge background color
// ----------------------

async function showBadgeColor() {
  let color = await chrome.action.getBadgeBackgroundColor({});
  document.getElementById('current-badge-bg-color').value = JSON.stringify(color, null, 0);
}

// Populate badge background color inputs on on page load
showBadgeColor();

document.getElementById('set-badge-background-color-button').addEventListener('click', async () => {
  // To show off this method, we must first make sure the badge has text
  let currentText = await chrome.action.getBadgeText({});
  if (!currentText) {
    chrome.action.setBadgeText({ text: 'hi :)' });
    showBadgeText();
  }

  // Next, generate a random RGBA color
  let color = [0, 0, 0].map(() => Math.floor(Math.random() * 255));

  // Use the default background color ~10% of the time.
  //
  // NOTE: Alpha color cannot be set due to crbug.com/1184905. At the time of writing (Chrome 89),
  // an alpha value of 0 sets the default color while a value of 1-255 will make the RGB color
  // fully opaque.
  if (Math.random() < 0.1) {
    color.push(0);
  } else {
    color.push(255);
  }

  chrome.action.setBadgeBackgroundColor({ color });
  showBadgeColor();
});

document.getElementById('reset-badge-background-color-button').addEventListener('click', async () => {
  chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
  showBadgeColor();
});

// -----------
// action icon
// -----------

const EMOJI = [
  'confetti',
  'suit',
  'bow',
  'dog',
  'skull',
  'yoyo',
  'cat',
];

let lastIconIndex = 0;
document.getElementById('set-icon-button').addEventListener('click', async () => {
  // Clear out the badge text in order to make the icon change easier to see
  chrome.action.setBadgeText({ text: '' });

  // Randomly pick a new icon
  let index = lastIconIndex;
  index = Math.floor(Math.random() * (EMOJI.length));
  if (index === lastIconIndex) {
    // Dupe detected! Increment the index & modulo to make sure we don't go out of bounds
    index = (index + 1) % EMOJI.length;
  }
  let emojiFile = `images/emoji-${EMOJI[index]}.png`;
  lastIconIndex = index;

  // There are easier ways for a page to extract an image's imageData, but the approach used here
  // works in both extension pages and service workers.
  let response = await fetch(chrome.runtime.getURL(emojiFile));
  let blob = await response.blob();
  let imageBitmap = await createImageBitmap(blob);
  let osc = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  let ctx = osc.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);
  let imageData = ctx.getImageData(0, 0, osc.width, osc.height);

  chrome.action.setIcon({ imageData });
});

document.getElementById('reset-icon-button').addEventListener('click', () => {
  let manifest = chrome.runtime.getManifest();
  chrome.action.setIcon({ path: manifest.action.default_icon });
});

// -------------
// get/set title
// -------------

let titleInput = document.getElementById('title-input');
let titleInputDebounce = Number.parseInt(titleInput.dataset.debounce || 100);
titleInput.addEventListener('input', debounce(200, async (event) => {
  let title = event.target.value;
  chrome.action.setTitle({ title });

  showActionTitle();
}));

document.getElementById('reset-title-button').addEventListener('click', async (event) => {
  let manifest = chrome.runtime.getManifest();
  let title = manifest.action.default_title;

  chrome.action.setTitle({ title });

  showActionTitle();
});

async function showActionTitle() {
  let title = await chrome.action.getTitle({});

  // If empty, the title falls back to the name of the extension
  if (title === '') {
    // … which we can get from the extension's manifest
    let manifest = chrome.runtime.getManifest();
    title = manifest.name;
  }

  document.getElementById('current-title').value = title;
}

// Populate action title inputs on on page load
showActionTitle();
