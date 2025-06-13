# Service Worker with Push Notification

This sample demonstrates how to use the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) in a Chrome Extension. It shows how to handle push notifications using `self.registration.pushManager.subscribe()` and allows silent pushes (`userVisibleOnly = false`).

## Overview

This extension demonstrates receiving push messages via a service worker. By interacting with an external push server, the extension can receive push notifications even when the popup or background script is inactive.

## Running this extension

### 1. Set Up the Extension

1. Clone this repository:
   ```bash
   git clone https://github.com/GoogleChrome/chrome-extensions-samples.git
   cd chrome-extensions-samples/functional-samples/cookbook.push
   ```
2. Open `background.js` and **replace** `APPLICATION_SERVER_PUBLIC_KEY` with your public key from the web push test server.

### 2. Load the Extension

1. Open Chrome and go to:
   ```
   chrome://extensions/
   ```
2. Enable **Developer Mode**.
3. Click **Load unpacked** and select the `cookbook.push` folder.

### 3. Test Push Subscription

1. Open the extension popup and click "Subscribe to Push".
2. Open DevTools (F12 or Cmd + Opt + I on Mac) → Console.
3. Copy the **Subscription Data** from the logs.

### 4. Send a Test Push

1. Go to the [web push test server](https://web-push-codelab.glitch.me/).
2. Paste the **Subscription Data** into "Subscription to Send To".
3. Enter a test message.
4. Click "SEND PUSH MESSAGE" and check:
   - The push data appears in the **Service Worker Console**.
   - If `userVisibleOnly = true`, a notification appears.

### 5. Debugging and Manual Testing

1. Open `chrome://extensions/`
2. Click **"service worker (Inactive)"** under the extension.
3. Run in DevTools Console:
   ```js
   await subscribeUserVisibleOnlyFalse();
   ```
4. Test manual notification:
   ```js
   self.registration.showNotification("Test Notification", {
     body: "Push notifications are working!",
     icon: "icon.png",
     requireInteraction: true
   });
   ```

---

## Additional Notes

- Ensure that `APPLICATION_SERVER_PUBLIC_KEY` is correctly configured in `background.js`.
- The push service requires an active service worker.
- Check Chrome’s **Service Worker Internals** (`chrome://serviceworker-internals/`) to debug service worker activity.
- Verify push permissions under `chrome://settings/content/notifications`.

This README now strictly follows the standard sample template while incorporating necessary fixes and updates.

