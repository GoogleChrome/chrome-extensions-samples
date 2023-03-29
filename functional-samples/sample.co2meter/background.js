import icon from "./modules/icon.js";
import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";

const WAKEUP_ALARM = "wakeup alarm";

console.log('Extension service worker background script (background.js)');

const secondToMinute = (seconds) => {
  return seconds / 60;
}

const co2MeterConnected = async () => {
  icon.setConnected();
  await CO2Meter.init();
  createAlarm(await storage.getInterval());
};

const co2MeterDisconnected = () => {
  icon.setDisconnected();
  clearAlarm();
}

const clearAlarm = () => {
  chrome.alarms.clear(WAKEUP_ALARM, (wasCleared) => {
    console.log(`Clear alarm ${WAKEUP_ALARM} wasCleared:${wasCleared}`);
  })
}

const initAlarm = () => {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (!CO2Meter.getDeviceStatus()) {
      clearAlarm();
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
  });
}

const createAlarm = (interval) => {
  chrome.alarms.create(WAKEUP_ALARM, {
    delayInMinutes: 0,
    periodInMinutes: secondToMinute(interval)
  });
}

const initilize = async () => {
  await CO2Meter.init();
  initAlarm();
  CO2Meter.registerCallback(co2MeterConnected, co2MeterDisconnected);
  if (!CO2Meter.getDeviceStatus()) {
    icon.setDisconnected();
    return;
  }
  createAlarm(await storage.getInterval());
}

if (navigator.hid) {
  initilize();
} else {
  console.log('WebHID not available!');
}

