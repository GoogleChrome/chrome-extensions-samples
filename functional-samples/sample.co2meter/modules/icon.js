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

class Icon {
  constructor() {}

  setConnected() {
    chrome.action.setTitle({ title: 'Connected' });
    chrome.action.setIcon({ path: { 32: 'images/icon32.png' } });
  }

  setDisconnected() {
    chrome.action.setTitle({ title: 'Disconnected' });
    chrome.action.setIcon({ path: { 32: 'images/icon32_disconnected.png' } });
  }
}

export default new Icon();
