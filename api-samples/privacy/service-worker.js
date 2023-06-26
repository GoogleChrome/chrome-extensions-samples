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

chrome.runtime.onInstalled.addListener(() => {
  // Set default value for Autofill Enabled
  chrome.privacy.services.autofillEnabled.set({ value: true });
});

chrome.runtime.onStartup.addListener(() => {
  updateAutofillEnabledStatus();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    updateAutofillEnabledStatus();
  }
});

function updateAutofillEnabledStatus() {
  chrome.privacy.services.autofillEnabled.get({}, (details) => {
    const autofillEnabled = details.value;
    const badgeText = autofillEnabled ? 'Enabled' : 'Disabled';
    const badgeColor = autofillEnabled ? '#00FF00' : '#FF0000';

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  });
}

chrome.action.onClicked.addListener(() => {
  updateAutofillEnabledStatus();
});
