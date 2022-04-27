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

// Initialize the demo on install
chrome.runtime.onInstalled.addListener((reason) => {
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) { return }

  openDemoTab();

  // Create an alarm so we have something to look at in the demo
  chrome.alarms.create('demo-default-alarm', {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });
});

chrome.action.onClicked.addListener(openDemoTab);

function openDemoTab() {
  chrome.tabs.create({ url: 'index.html' });
}
