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

// Once the message has been posted from the service worker, checks are made to confirm the message
// type and target before proceeding. This is so that the module can easily be adapted into existing
// workflows where secondary uses for the document (or alternate offscreen documents) might be
// implemented.

// Registering this listener when the script is first executed ensures that the offscreen document
// will be able to receive messages when the promise returned by `offscreen.createDocument()`
// resolves.
chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before dispatching the
// message to a more specific message handler.
async function handleMessages(message) {
  // Return early if this message isn't meant for the offscreen document.
  if (message.target !== 'offscreen-doc') {
    return;
  }

  // Dispatch the message to an appropriate handler.
  switch (message.type) {
    case 'copy-data-to-clipboard':
      handleClipboardWrite(message.data);
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
  }
}

// Use the offscreen document's `document` interface to write a new value to the system clipboard
async function handleClipboardWrite(data) {
  // Error if we received the wrong kind of data.
  if (typeof data !== 'string') {
    throw new TypeError(`Value provided must be a 'string', got '${typeof data}'.`);
    return;
  }

  // Write data the clipboard.

  // `document.execCommand('copy')` works against the user's selection in a web page. As such, we
  // need to insert the updated text into the document and select it before it can be added to the
  // clipboard.
  textEl.value = data;
  textEl.select();
  document.execCommand('copy');
}

// This textarea is used to easily modify and select it's text value.
let textEl = document.querySelector('#text');
