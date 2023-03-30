import icon from "./modules/icon.js";
import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";

console.log('Extension service worker background script (background.js)');

async function co2MeterConnected() {
  icon.setConnected();
  await CO2Meter.init();
  createAlarm();
};

function co2MeterDisconnected() {
  icon.setDisconnected();
  chrome.alarms.clearAll();
}

async function createAlarm() {
  chrome.alarms.create("getReadingAlarm", {
    delayInMinutes: 0,
    periodInMinutes: await storage.getIntervalInSeconds() / 60
  });
}

async function onAlarmGetReading(alarm) {
  if (!CO2Meter.getDeviceStatus()) {
    chrome.alarms.clearAll();
    icon.setDisconnected();
    return;
  }

  try {
    var reading = await CO2Meter.getCO2Reading();
    storage.setCO2Value(reading['CO2']);
    storage.setTempValue(reading['Temp']);
  } catch (e) {
    console.log('Exception when reading CO2!', e);
  }
}

async function initilize() {
  await CO2Meter.init();
  await storage.init();
  chrome.alarms.onAlarm.addListener(onAlarmGetReading);
  CO2Meter.registerCallback(co2MeterConnected, co2MeterDisconnected);
  if (!CO2Meter.getDeviceStatus()) {
    icon.setDisconnected();
    return;
  }
  createAlarm();
}

if (navigator.hid) {
  initilize();
} else {
  console.error('WebHID not available!');
}
