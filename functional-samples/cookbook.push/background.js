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

/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "subscribeUserVisibleOnlyFalse" }]*/

const APPLICATION_SERVER_PUBLIC_KEY = '<key>';

async function subscribeUserVisibleOnlyFalse() {
  const applicationServerKey = urlB64ToUint8Array(
    APPLICATION_SERVER_PUBLIC_KEY
  );
  try {
    let subscriptionData = await self.registration.pushManager.subscribe({
      // With our new change[1], this can be set to false. Before it must
      // always be set to true otherwise an error will be thrown about
      // permissions denied.
      userVisibleOnly: false,
      applicationServerKey: applicationServerKey
    });
    console.log('[Service Worker] Extension is subscribed to push server.');
    logSubscriptionDataToConsole(subscriptionData);
  } catch (error) {
    console.error('[Service Worker] Failed to subscribe, error: ', error);
  }
}

function logSubscriptionDataToConsole(subscription) {
  // The `subscription` data would normally only be know by the push server,
  // but for this sample we'll print it out to the console so it can be pasted
  // into a testing push notification server (at
  // https://web-push-codelab.glitch.me/) to send push messages to this
  // endpoint (extension).
  console.log(
    '[Service Worker] Subscription data to be pasted in the test push' +
      'notification server: '
  );
  console.log(JSON.stringify(subscription));
}

// Push message event listener.
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');
  console.log(
    `[Service Worker] Push had this data/text: "${event.data.text()}"`
  );

  // Before `userVisibleOnly` could be passed as false we would have to show a
  // notification at this point, but now we no longer have to.
});

// Helper method for converting the server key to an array that is passed
// when subscribing to a push server.
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// [1]: https://chromiumdash.appspot.com/commit/f6a8800208dc4bc20a0250a7964983ce5aa746f0
