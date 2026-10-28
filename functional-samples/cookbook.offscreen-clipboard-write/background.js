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

// The value that will be written to the clipboard.
const textToCopy = `Hello world!`;

// When the browser action is clicked, `addToClipboard()` will write the value
// of `textToCopy` to the system clipboard.
chrome.action.onClicked.addListener(async () => {
  await addToClipboard(textToCopy);
});

// Starting in Chrome 157, extension service workers with the `clipboardWrite`
// permission can use `navigator.clipboard` directly.
async function addToClipboard(value) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
  } else {
    // Prior to Chrome 157, service workers could not directly interact with
    // the system clipboard. To work around this, create an offscreen document
    // and pass it the data to write to the clipboard.
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Write text to the clipboard.'
    });

    // Now that we have an offscreen document, we can dispatch the
    // message.
    chrome.runtime.sendMessage({
      type: 'copy-data-to-clipboard',
      target: 'offscreen-doc',
      data: value
    });
  }
}
