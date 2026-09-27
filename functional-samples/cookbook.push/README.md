# Service Worker with Push Notification

This Chrome extension demonstrates using the [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) with `self.registration.pushManager.subscribe()`. It shows how to handle push notifications while allowing silent pushes (`userVisibleOnly = false`).

## Overview

By calling a method in the extension and using an external push server, we can simulate receiving a push message without requiring a visible notification.

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

### 5. Manual Testing in Service Worker

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

## Template for `send-push.js`

This script is used to send push notifications manually. Replace the subscription details with those from your console logs.

```javascript
const webPush = require("web-push");

// Replace these with your generated VAPID keys
const VAPID_KEYS = {
  publicKey: "YOUR_PUBLIC_KEY_HERE",
  privateKey: "YOUR_PRIVATE_KEY_HERE",
};

// Configure web-push
webPush.setVapidDetails(
  "mailto:your-email@example.com",
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
);

// Replace with the subscription data from your console logs
const pushSubscription = {
  endpoint: "PASTE_ENDPOINT_HERE",
  keys: {
    p256dh: "PASTE_P256DH_KEY_HERE",
    auth: "PASTE_AUTH_KEY_HERE",
  },
};

// Push message payload
const payload = JSON.stringify({
  title: "New Push Notification!",
  message: "Hello! This is a test push message from your backend.",
  showNotification: true,
});

// Send push notification
webPush
  .sendNotification(pushSubscription, payload)
  .then(() => console.log("Push Notification Sent!"))
  .catch((err) => console.error("Error Sending Push Notification:", err));
```

---

## Changes in This Update

### `background.js`

- **Added** `self.skipWaiting()` to ensure immediate activation.
- **Ensured** `subscribeUserVisibleOnlyFalse()` runs on activation.
- Improved **console logging** for debugging.

### `manifest.json`

- Added `"gcm_sender_id": "103953800507"` for push compatibility.

### `popup.js`

- Improved **error handling** for service worker availability.
- Added logging for **subscription success and errors**.

### `popup.html`

- Added an **ID for status messages** (`<p id="status"></p>`).

---

## Debugging

- If push notifications do not appear, check:
  - Console Logs (F12 → Console)
  - Permissions (`chrome://settings/content/notifications`)
  - Service Worker Status (`chrome://serviceworker-internals/`)

