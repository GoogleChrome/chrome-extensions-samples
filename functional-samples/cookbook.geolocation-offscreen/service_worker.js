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

const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// A global promise to avoid concurrency issues
let creating;
let locating;

// There can only be one offscreenDocument. So we create a helper function
// that returns a boolean indicating if a document is already active.
async function hasDocument() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const matchedClients = await clients.matchAll();

  return matchedClients.some(
    (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument(path) {
  //if we do not have a document, we are already setup and can skip
  if (!(await hasDocument())) {
    // create offscreen document
    if (creating) {
      await creating;
    } else {
      creating = chrome.offscreen.createDocument({
        url: path,
        reasons: [
          chrome.offscreen.Reason.GEOLOCATION ||
            chrome.offscreen.Reason.DOM_SCRAPING
        ],
        justification: 'add justification for geolocation use here'
      });

      await creating;
      creating = null;
    }
  }
}

async function getGeolocation() {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

  const geolocation = await chrome.runtime.sendMessage({
    type: 'get-geolocation',
    target: 'offscreen'
  });

  await closeOffscreenDocument();
  return geolocation;
}

async function closeOffscreenDocument() {
  if (!(await hasDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}

// takes a raw coordinate, and returns a DMS formatted string
const generateDMS = (coords, isLat) => {
  const abs = Math.abs(coords);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = ((abs - deg - min / 60) * 3600).toFixed(1);
  const direction = coords >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W';

  return `${deg}°${min}'${sec}"${direction}`;
};

async function setTitle(title) {
  return chrome.action.setTitle({ title });
}

async function setIcon(filename) {
  return chrome.action.setIcon({ path: `images/${filename}.png` });
}

chrome.action.onClicked.addListener(async () => {
  try {
    if (locating) {
      return await locating;
    }

    setIcon('lightgreen');
    await setTitle('locating...');

    locating = await getGeolocation();
    const { coords } = locating;
    let { latitude, longitude } = coords;
    latitude = generateDMS(latitude, true);
    longitude = generateDMS(longitude);

    setIcon('green');
    await setTitle(`position: ${latitude}, ${longitude}`);
  } catch (e) {
    setIcon('red');
    await setTitle(`unable to set location - ${e.message}`);
  }

  locating = null;
});
