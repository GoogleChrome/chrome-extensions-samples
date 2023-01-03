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

// TODO(dotproto): Add more comments explaining this code.

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
  // Return early if this message isn't meant for the offscreen document.
  if (message.target !== 'offscreen-doc') {
    return;
  }

  // Return early if we got the wrong type of message.
  if (message.type === 'copy-data-to-clipboard') {
    handleClipboardWrite(message.data);
  }
}

async function handleClipboardWrite(data) {
  // Return early if we received the wrong kind of data.
  if (typeof data !== 'string') {
    console.debug(`Unexpected data value. Expected a 'string' value but received '${typeof data}'. Aborting.`)
    return;
  }

  // Write data the clipboard.
  textEl.value = data;
  textEl.select();
  document.execCommand('copy');
}

let textEl = document.querySelector('#text');
