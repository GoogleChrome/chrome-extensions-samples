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

// This code is a modified version of
// https://codelabs.developers.google.com/codelabs/push-notifications

// These methods are meant to be called by the developer following the cookbook.
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "subscribeUser" }]*/

const applicationServerPublicKey = '<key>';

// Whether the extension will attempt to show a notification or not. Controlled
// by subscribeUserVisibleOnlyFalse() and subscribeUserVisibleOnlyTrue(). Not
// meant to be used in production due to ephemeral nature of service workers.
let should_show_notification = true;

function subscribeUser(userVisibleOnly) {
  should_show_notification = userVisibleOnly;
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  self.registration.pushManager
    .subscribe({
      // With our new change, this can be set to false. Before/now it must always
      // be set to true otherwise an error will be thrown about permissions denied.
      userVisibleOnly: userVisibleOnly,
      applicationServerKey: applicationServerKey
    })
    .then(function (subscription) {
      console.log('[Service Worker] Extension is subscribed to push server.');

      updateSubscriptionOnServer(subscription);
    })
    .catch(function (error) {
      console.error('[Service Worker] Failed to subscribe, error: ', error);
    });
}

function updateSubscriptionOnServer(subscription) {
  // This data would normally be sent to the server, but for this sample we'll
  // print it out to the console so it can be pasted into a testing push
  // notification server (at https://web-push-codelab.glitch.me/) to ensure the
  // push message will reach this endpoint (extension).
  console.log(
    '[Service Worker] Subscription data to be sent to the push' +
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

  const user_visible_notification_title = 'Service Worker Push Sample';
  const user_visible_notification_options = {
    body: `Yay it works! Received push notification to the chrome extension
     with text/data "${event.data.text()}"`
  };

  // If these lines are not run the browser will still get a notification that
  // is of the below format (unless `userVisibleOnly: false` is passed when
  // subscribing to the push server):
  // Title: chrome-extension://<id>
  // Subject: Service worker with push notification
  // Message body: This site has been updated in the background.
  if (should_show_notification) {
    const notificationPromise = self.registration.showNotification(
      user_visible_notification_title,
      user_visible_notification_options
    );
    event.waitUntil(notificationPromise);
  }
});

// This simply ensures that the notification is closed when clicked, it's
// not necessary for the sample but is helpful.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
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
