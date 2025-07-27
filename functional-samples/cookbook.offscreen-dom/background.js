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
const OFFSCREEN_DOCUMENT_REASONS = [chrome.offscreen.Reason.DOM_PARSER];
const OFFSCREEN_DOCUMENT_JUSTIFY = 'Parse DOM';

chrome.action.onClicked.addListener(async () => {
  sendMessageToOffscreenDocument(
    'add-exclamationmarks-to-headings',
    '<html><head></head><body><h1>Hello World</h1></body></html>'
  );
});

let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: OFFSCREEN_DOCUMENT_REASONS,
      justification: OFFSCREEN_DOCUMENT_JUSTIFY
    });
    await creating;
    creating = null;
  }
}

async function sendMessageToOffscreenDocument(type, data) {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

  // Send message to offscreen document
  chrome.runtime.sendMessage({
    type,
    target: 'offscreen',
    data
  });
}

chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleMessages(message) {
  // Return early if this message isn't meant for the background script
  if (message.target !== 'background') {
    return;
  }

  // Dispatch the message to an appropriate handler.
  switch (message.type) {
    case 'add-exclamationmarks-result':
      handleAddExclamationMarkResult(message.data);
      chrome.offscreen.closeDocument().catch(error => {
        console.warn(
          'Received an error while attempting to close an offscreen document, after receiving a message assumed to come from an offscreen document: %o', error)
      });
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}

async function handleAddExclamationMarkResult(dom) {
  console.log('Received dom', dom);
}