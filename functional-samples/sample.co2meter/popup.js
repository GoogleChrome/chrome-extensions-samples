// Copyright 2023 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

import storage from "./modules/storage.js";
import {
  NEW_READING_SAVED_MESSAGE
} from "./modules/constant.js";

function registerMessageChannel() {
  // TODO: randomUUID to differentiate multiple multiple popup.html.
  // Is there any better way to get unique id for different extension document?
  var port = chrome.runtime.connect({ name: 'popup client-' + crypto.randomUUID() });
  port.onMessage.addListener(function (msg) {
    if (msg === NEW_READING_SAVED_MESSAGE) {
      // TODO: refresh the chart with new data in the storage.
      console.log('to refresh the chart');
      storage.getCO2ValueInRange(1680151566926).then((e) => console.log('CO2:', e));
      storage.getTempValueInRange(1680151566926).then((e) => console.log('Temp', e));      
    }
  });
}

window.onload = async e => {
  mainPageButton.onclick = e => { window.open('main-page.html', '_blank'); };
  registerMessageChannel();  
};
