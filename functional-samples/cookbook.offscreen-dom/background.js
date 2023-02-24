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

// Close any existing offscreen documents to avoid inconsistencies
// with an updated service worker version
addEventListener('install', async (event) => {
  closeOffscreenDocument();
});

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
      closeOffscreenDocument();
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}

chrome.action.onClicked.addListener(async () => {
  sendMessageToOffscreenDocument(
    'add-exclamationmarks-to-headings',
    '<html><head></head><body><h1>Hello World</h1></body></html>'
  );
});

async function handleAddExclamationMarkResult(dom) {
  console.log('Received dom', dom);
}

async function sendMessageToOffscreenDocument(type, data) {
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Parse DOM'
    });
  }
  // Now that we have an offscreen document, we can dispatch the
  // message.
  chrome.runtime.sendMessage({
    type,
    target: 'offscreen',
    data
  });
}

async function closeOffscreenDocument() {
  if (!(await chrome.offscreen.hasDocument())) {
    return;
  }
  console.log('closing offscreen doc');
  await chrome.offscreen.closeDocument();
}
