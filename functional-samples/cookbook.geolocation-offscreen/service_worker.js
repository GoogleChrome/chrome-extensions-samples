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

chrome.runtime.onMessage.addListener(handleMessages);

let creating; // A global promise to avoid concurrency issues

async function hasDocument() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const matchedClients = await clients.matchAll();

  return matchedClients.some((c) => c.url === OFFSCREEN_DOCUMENT_PATH);
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

async function handleMessages(message) {
  switch (message.type) {
    case 'geolocation-success':
      console.log(message.data);
      closeOffscreenDocument();
      break;
    case 'geolocation-err':
      console.error(message.data);
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}

async function sendMessageToOffscreenDocument(type) {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

  chrome.runtime.sendMessage({
    type,
    target: 'offscreen'
  });
}

async function closeOffscreenDocument() {
  if (!(await hasDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}
