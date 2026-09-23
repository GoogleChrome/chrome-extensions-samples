console.log("Popup script loaded.");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    console.log("Service Worker is ready:", reg);
  }).catch((err) => console.error("Service Worker is not available:", err));
} else {
  console.error("Service workers are not supported in this browser.");
}

// Subscription button
document.getElementById("subscribe").addEventListener("click", async () => {
  console.log("Subscribing to push...");
  const statusElement = document.getElementById("status");

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: "BCLyuEzuxaJ9bCt5yWcniKUHaiOWASyZlB-w8uFpGHYCKzfxGRodfrmMUHBaLAqFk6UtfhGqPmPkNWWbwAsC1ko"
    });

    console.log("Subscription successful:", JSON.stringify(subscription));
    statusElement.innerText = "Subscribed!";
  } catch (error) {
    console.error("Subscription failed:", error);
    statusElement.innerText = "Subscription failed!";
  }
});

// Unsubscribe button
document.getElementById("unsubscribe").addEventListener("click", async () => {
  console.log("Unsubscribing from push...");
  const statusElement = document.getElementById("status");

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    console.log("Successfully unsubscribed.");
    statusElement.innerText = "Unsubscribed!";
  } else {
    console.log("No active subscription found.");
    statusElement.innerText = "No active subscription!";
  }
});