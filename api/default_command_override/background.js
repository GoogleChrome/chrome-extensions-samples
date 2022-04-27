// Copyright 2017 Google LLC
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

chrome.commands.onCommand.addListener(async (command) => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  // Sort tabs according to their index in the window.
  tabs.sort((a, b) => { return a.index < b.index; });
  let activeIndex = tabs.findIndex((tab) => { return tab.active; });
  let lastTab = tabs.length - 1;
  let newIndex = -1;
  if (command === 'flip-tabs-forward')
    newIndex = activeIndex === 0 ? lastTab : activeIndex - 1;
  else  // 'flip-tabs-backwards'
    newIndex = activeIndex === lastTab ? 0 : activeIndex + 1;
  chrome.tabs.update(tabs[newIndex].id, { active: true, highlighted: true });
});
