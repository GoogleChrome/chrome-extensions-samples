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

// Registering this listener when the script is first executed ensures that the
// offscreen document will be able to receive messages when the promise returned
// by `offscreen.createDocument()` resolves.

chrome.runtime.onMessage.addListener(handleMessages);
async function handleMessages(message) {
  // Return early if this message isn't meant for the offscreen document.
  if (message.target !== 'offscreen') {
    return false;
  }

  switch (message.type) {
    case 'get-geolocation':
      getGeolocation(message.data);
      break;
    default:
      console.warn(`Unexpected message type received: '${message.type}'.`);
      return false;
  }
}

function sendToServiceWorker(type, data) {
  chrome.runtime.sendMessage({
    type,
    target: 'background',
    data
  });
}

// getCurrentPosition returns a prototype based object, so the properties
// end up being stripped off when sent over to our service worker. To get
// around this, we deeply clone it
function cloneObj(obj) {
  const clone = {};

  // Return the value of any non true object (typeof(null) is "object") directly.
  // null will throw an error if you try to for/in it. We can just return
  // the value early.
  if (obj === null || !(obj instanceof Object)) {
    return obj;
  } else {
    for (const p in obj) {
      clone[p] = cloneObj(obj[p]);
    }
  }
  return clone;
}

function getGeolocation() {
  navigator.geolocation.getCurrentPosition(
    (loc) => {
      sendToServiceWorker('geolocation-success', cloneObj(loc));
    },
    (err) => {
      // in case the user doesnt have or is blocking `geolocation`
      sendToServiceWorker('geolocation-err', err);
    }
  );
}
