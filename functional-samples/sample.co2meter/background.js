import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";

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

chrome.alarms.onAlarm.addListener(async (alarm) => {
  // TODO: to call driver API to check device status and call reading API only if the device is granted and connected.
  // var co2Reading = await getCO2Reading();
  var co2Reading = 0;
  // TODO: call CO2 driver to read CO2 value.
  storage.saveCO2Value(co2Reading);
});