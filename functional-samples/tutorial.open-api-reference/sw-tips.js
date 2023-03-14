console.log('sw-tips.js');

// Fetch tip & save in storage
const updateTip = async () => {
  const response = await fetch('https://extension-tips.glitch.me/tips.json');
  const tips = await response.json();
  const index = Math.floor(Math.random() * tips.length);
  await chrome.storage.local.set({ tip: tips[index] });
};

// Create a daily alarm to retrieve a new tip
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.alarms.create({ delayInMinutes: 1, periodInMinutes: 1440 });
    updateTip();
  }
});

// TIP OF THE DAY
chrome.alarms.onAlarm.addListener(updateTip);

// LISTEN FOR TIP REQUEST
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.greeting === 'tip') {
    chrome.storage.local.get('tip').then(sendResponse);
    return true;
  }
});
