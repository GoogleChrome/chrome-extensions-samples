import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";

const WAKEUP_ALARM = "wakeup alarm";

console.log('Extension service worker background script (background.js)');

const secondToMinute = (seconds) => {
  return seconds / 60;
}

const setCO2MeterDisconnectedIcon = () => {
  chrome.action.setIcon(
    { path: { '32': 'images/icon32_disconnected.png' } },
    () => { console.log('Update the extension icon to CO2 disconnected!') },
  );
}

const setCO2MeterConnectedIcon = () => {
  chrome.action.setIcon(
    { path: { '32': 'images/icon32.png' } },
    () => { console.log('Update the extension icon to CO2 connected!') },
  );
}

const co2MeterConnected = async () => {
  setCO2MeterConnectedIcon();
  await CO2Meter.init();
  createAlarm(storage.getInterval());
}

const co2MeterDisconnected = () => {
  setCO2MeterDisconnectedIcon();
  clearAlarm();
}

const clearAlarm = () => {
  chrome.alarms.clear(WAKEUP_ALARM, () => {
    console.log('Cleared wakeup alarm as CO2 meter is not visible anymore!');
  })
}

const createAlarm = (interval) => {
  chrome.alarms.create(WAKEUP_ALARM, {
    delayInMinutes: 0,
    periodInMinutes: secondToMinute(interval)
  });

  chrome.alarms.onAlarm.addListener(async () => {
    if (!CO2Meter.getDeviceStatus()) {
      clearAlarm();
      setCO2MeterDisconnectedIcon();
      return;
    }
    try {
      // var co2Reading = await CO2Meter.getCO2Reading();
      // storage.saveCO2Value(co2Reading);
      console.log('to read CO2');
    } catch (e) {
      console.log('Exception when reading CO2!', e);
    }

  });
}

const initilize = async () => {
  await CO2Meter.init();
  CO2Meter.registerCallback(co2MeterConnected, co2MeterDisconnected);
  if (!CO2Meter.getDeviceStatus()) {
    setCO2MeterDisconnectedIcon();
    return;
  }
  createAlarm(storage.getInterval());
}

if (navigator.hid) {
  initilize();
} else {
  console.log('WebHID not available!');
}

