# Service worker with push notification

This sample demonstrates using the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) with `self.registration.pushManager.subscribe()` and specifically how to use `userVisibleOnly` to silence required notifications when receiving a push message in a service worker based extension.

## Overview

By calling a method in the sample and using an external push server website we can simulate an extension receiving a push message where it is required to emit a notification and where it can bypass that requirement (`userVisibleOnly = false`).

## Running this extension

1. Clone this repository.
2. Ensure your operating system allows your browser to show desktop notification. For [MacOS](https://support.apple.com/guide/mac-help/change-notifications-settings-mh40583/mac), and for for Google Chrome, it requires "Google Chrome" and "Google Chrome Helper (Alerts)" to be allowed.
3. Go to [web-push-codelab.glitch.me](web-push-codelab.glitch.me) and copy the “Public Key” to the `applicationServerPublicKey` variable in background.js.
4. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
5. Click “service worker (Inactive)” on the extension to load DevTools for background.js
6. Call `subscribeUser(true);`
7. Copy the output after “Subscription data to be sent to the push notification server:” and paste it into [web-push-codelab.glitch.me](web-push-codelab.glitch.me) inside “Subscription to Send To” text box
8. Enter some text into “Text to Send”
9. Click “SEND PUSH MESSAGE”
10. Observe the notification being sent to the browser that has the text from step #8. You’ll also see the text you sent in the dev console log
11. In DevTools call: `subscribeUser(false);`
12. Go back to web-push-codelab.glitch.me and click “SEND PUSH MESSAGE”
13. Observe that there is no notification with the text you sent and no generic notification notification being shown by the browser. You’ll also see the text you sent in the DevTools log, but the message was received silently.
