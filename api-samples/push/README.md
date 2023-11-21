# self.registration.pushManager.subscribe() userVisibleOnly

This sample demonstrates using the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) in chrome with `self.registration.pushManager.subscribe()` and specifically how to use `userVisibleOnly` to silence required notifications when receiving a push message in a service worker based extension.

## Overview

By calling a method in the sample and using an external push server website we can simulate an extension receiving a push message where it is required to emit a notification and where it can bypass that requirement (`userVisibleOnly = false`).

## Running this extension

1. Clone this repository.
2. Go to [web-push-codelab.glitch.me](web-push-codelab.glitch.me) and copy the “Public Key” to the `applicationServerPublicKey` variable in background.js.
3. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
4. Click “service worker (Inactive)” on the extension to load DevTools for background.js
5. Call `subscribeUserVisibleOnlyTrue();`
6. Copy the output after “Subscription data to be sent to the push notification server:” and paste it into [web-push-codelab.glitch.me](web-push-codelab.glitch.me) inside “Subscription to Send To” text box
7. Enter some text into “Text to Send”
8. Click “SEND PUSH MESSAGE”
9. Observe the notification being sent to the browser that has the text from step #7. You’ll also see the text you sent in the dev console log
10. In DevTools call: `subscribeUserVisibleOnlyFalse();`
11. Go back to web-push-codelab.glitch.me and click “SEND PUSH MESSAGE”
12. Observe that there is no notification with the text you sent and no generic notification notification being shown by the browser. You’ll also see the text you sent in the DevTools log, but the message was received silently.

