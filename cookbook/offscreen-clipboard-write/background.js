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

const textToCopy = `Hello world!`;

chrome.action.onClicked.addListener(async () => {
  await addToClipboard(textToCopy);
});

// Solution 1 - Current solution for extension service workers

async function addToClipboard(value) {
  if (await chrome.offscreen.hasDocument()) {
    console.debug('Offscreen doc already exists');
  } else {
    console.debug('Creating a new offscreen document.');

    // TODO(dotproto): Follow up with eng to make sure that the doc's
    // `runtime.onMessage` listener will be registered before the
    // `createDocument()` call resolves. If not, we'll need to rewrite this to
    // guarantee the correct order of operations.
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Write text to the clipboard.',
    });
  }

  chrome.runtime.sendMessage({
    type: 'copy-data-to-clipboard',
    target: 'offscreen-doc',
    data: value,
  });
}

// Solution 2 – Only use this when

async function addToClipboardV2(value) {
  navigator.clipboard.copyText(value)
}
