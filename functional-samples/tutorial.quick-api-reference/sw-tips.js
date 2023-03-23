console.log('sw-tips.js');

// Fetch tip & save in storage
const updateTip = async () => {
  const response = await fetch('https://extension-tips.glitch.me/tips.json');
  const tips = await response.json();
  const randomIndex = Math.floor(Math.random() * tips.length);
  await chrome.storage.local.set({ tip: tips[randomIndex] });
};

// Creates an alarm if it doesn't exist
async function createAlarm() {
  const alarm = await chrome.alarms.get("tip");
  if (typeof alarm === "undefined") {
    await chrome.alarms.create("tip", { delayInMinutes: 1, periodInMinutes: 1440 });
    updateTip();
  }
}

createAlarm();

// Retrieve tip of the day
chrome.alarms.onAlarm.addListener(updateTip);

// Send tip to content script via messaging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.greeting === 'tip') {
    chrome.storage.local.get('tip').then(sendResponse);
    return true;
  }
});
