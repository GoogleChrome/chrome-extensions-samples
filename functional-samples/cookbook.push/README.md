# Service worker with push notification

This sample demonstrates using the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) with `self.registration.pushManager.subscribe()` and specifically how to use `userVisibleOnly` to silence required notifications when receiving a push message in a service worker based extension.

## Overview

By calling a method in the sample and using the [`web-push` CLI](https://github.com/web-push-libs/web-push#command-line), we can send a test push message to the extension without a hosted test server. With `userVisibleOnly: false`, the browser does not require a visible notification for each push.

## Running this extension

Note: This sample requires Chrome 132+. Before Chrome 132, the same code works with the additional requirement of the `notification` extension permission.

1. Clone this repository.
1. Generate a VAPID key pair with `npx --yes web-push generate-vapid-keys`. Save both keys locally; do not share the **private** key.
1. Copy the generated **Public Key** into the `APPLICATION_SERVER_PUBLIC_KEY` variable in `background.js`. Do not put the private key into the extension.
1. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
1. Click “service worker (Inactive)” on the extension to load DevTools for `background.js`.
1. In DevTools call: `await subscribeUserVisibleOnlyFalse();`
1. Copy the JSON printed after “Subscription data to be pasted in the test push notification server:” and note its `endpoint`, `keys.p256dh`, and `keys.auth` values.
1. From a local terminal, send a test message using the *same* VAPID key pair. Replace the placeholders with values from the subscription JSON and the generated keys:

   ```sh
   npx --yes web-push send-notification --endpoint="<endpoint>" --key="<keys.p256dh>" --auth="<keys.auth>" --vapid-subject="mailto:you@example.com" --vapid-pubkey="<public VAPID key>" --vapid-pvtkey="<private VAPID key>" --payload="Hello from the extension sample"
   ```

   Keep your subscription endpoint, auth secret, and private VAPID key out of public logs and issue reports.
1. Observe that no notification appears in the browser. The extension service worker's DevTools log should show “Push Received.” and the test payload, confirming delivery without a visible notification.
