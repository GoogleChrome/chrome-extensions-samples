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


console.log("✅ Background service worker is running!");

// Install event
self.addEventListener("install", () => {
  console.log("✅ Service Worker Installed.");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker Activated.");
  event.waitUntil(subscribeUserVisibleOnlyFalse());
});

// Function to subscribe to push notifications
async function subscribeUserVisibleOnlyFalse() {
  console.log("🔄 Checking existing subscription...");
  const existingSubscription = await self.registration.pushManager.getSubscription();

  if (existingSubscription) {
    console.log("✅ Already subscribed:", existingSubscription);
    return existingSubscription;
  }

  console.log("📩 Subscribing to push notifications...");
  const applicationServerKey = urlB64ToUint8Array("BCLyuEzuxaJ9bCt5yWcniKUHaiOWASyZlB-w8uFpGHYCKzfxGRodfrmMUHBaLAqFk6UtfhGqPmPkNWWbwAsC1ko");

  try {
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    console.log("✅ Subscription successful:", subscription);
    return subscription;
  } catch (error) {
    console.error("❌ Subscription failed:", error);
  }
}

// Push event listener - Handles incoming push notifications
self.addEventListener("push", (event) => {
  console.log("✅ Push Event Received!");

  if (!event.data) {
    console.log("❌ No push data received.");
    return;
  }

  const pushData = event.data.json();
  console.log("📨 Push Data:", pushData);

  event.waitUntil(
    self.registration.showNotification(pushData.title, {
      body: pushData.message,
      icon: "icon.png",
      data: { url: pushData.url || "" },  // Ensure proper click handling
      requireInteraction: true
    })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("🔗 Notification Clicked:", event.notification.data.url);
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Helper function to convert base64 key to Uint8Array
function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}


// [1]: https://chromiumdash.appspot.com/commit/f6a8800208dc4bc20a0250a7964983ce5aa746f0
