// Copyright 2022 Google LLC
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

const LIST_ELEMENT = document.querySelector('ul');

async function updateUI() {
  const tabs = await chrome.tabs.query({
    currentWindow: true
  });

  // Reset element.
  LIST_ELEMENT.innerHTML = '';

  for (const tab of tabs) {
    const element = document.createElement('li');
    element.innerText = tab.title;

    element.addEventListener('click', async () => {
      // need to focus window as well as the active tab
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    });

    LIST_ELEMENT.append(element);
  }
}

// We need to update the UI as soon as the page loads.
window.addEventListener('load', () => {
  updateUI();
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if ('url' in changeInfo || 'title' in changeInfo) {
      updateUI();
    }
  });
  chrome.tabs.onCreated.addListener(updateUI);
  chrome.tabs.onRemoved.addListener(updateUI);
  chrome.tabs.onMoved.addListener(updateUI);
});
