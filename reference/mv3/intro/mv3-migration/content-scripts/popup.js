// Copyright 2021 Google LLC
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

let injectFile = document.getElementById('inject-file');
let injectFunction = document.getElementById('inject-function');

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

injectFile.addEventListener('click', async () => {
  let tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content-script.js']
  });
});

function showAlert(givenName) {
  alert(`Hello, ${givenName}`);
}

injectFunction.addEventListener('click', async () => {
  let tab = await getCurrentTab();

  let name = 'World';
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: showAlert,
    args: [name]
  });
});
