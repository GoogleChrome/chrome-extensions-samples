// Copyright 2025 Google LLC
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

let featureEnabled = false;

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'run-action') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: 'Commands API Demo',
      message: 'The "run-action" command was triggered.'
    });
  }

  if (command === 'toggle-feature') {
    featureEnabled = !featureEnabled;
    const state = featureEnabled ? 'ON' : 'OFF';

    chrome.action.setBadgeText({ text: featureEnabled ? 'ON' : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#4688F1' });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: 'Feature Toggled',
      message: `The feature is now ${state}.`
    });
  }
});
