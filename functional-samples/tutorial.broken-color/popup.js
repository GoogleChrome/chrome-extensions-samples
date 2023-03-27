// Copyright 2018 Google LLC
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

const changeColorButton = document.getElementById('changeColor');

// Retrieve the color from storage and update the button's style and value
chrome.storage.sync.get('color', ({ color }) => {
  changeColorButton.style.backgroundColor = color;
  changeColorButton.setAttribute('value', color);
});

// Update the click event handler with an arrow function
changeColorButton.addEventListener('click', (event) => {
  const color = event.target.value;

  // Query the active tab before injecting the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Use the 'chrome.scripting' API to execute a script
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      args: [color],
      func: (color) => {
        // There's a typo in the line below;
        // ❌ colors should be ✅ color.
        document.body.style.backgroundColor = color;
      }
    });
  });
});

async function setColor() {
  let { color } = await chrome.storage.sync.get(['color']);
  document.body.style.backgroundColor = color;
}