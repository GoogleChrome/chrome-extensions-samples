import storage from "./modules/storage.js";

console.log('Extension service worker background script (background.js)');

if (navigator.hid) {
  console.log('WebHID is available');
} else {
  console.log('WebHID not available');
}

const secondToMinute = (seconds) => {
  return seconds / 60;
}

chrome.alarms.create("Wakeup to read CO2", {
  delayInMinutes: 0,
  periodInMinutes: secondToMinute(storage.getInterval())
});

chrome.alarms.onAlarm.addListener((alarm) => {
  var co2Reading = 0;
  // TODO: call CO2 driver to read CO2 value.
  storage.saveCO2Value(co2Reading);
});