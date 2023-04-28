// Copyright 2023 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

import icon from './modules/icon.js';
import storage from './modules/storage.js';
import CO2Meter from './modules/co2_meter.js';
import {
  CO2_READING_KEY,
  TEMPERATURE_READING_KEY,
  NEW_READING_SAVED_MESSAGE,
  PERMISSION_GRANTED_MESSAGE,
  CO2_METER_UNAVAILABLE
} from './modules/constant.js';

const KEEP_ALIVE_ALARM = 'keepAliveAlarm';
const GET_READING_ALARM = 'getReadingAlarm';
const KEEP_ALIVE_FOR_READING_ALARM = 'keepAliveForReadingAlarm';

let clients = new Set();

function keepServiceWorkerAlive(seconds) {
  chrome.alarms.create(KEEP_ALIVE_ALARM, {
    delayInMinutes: 0,
    periodInMinutes: 20 / 60
  });
  setTimeout(() => {
    chrome.alarms.clear(KEEP_ALIVE_ALARM);
  }, seconds * 1000);
}

async function co2MeterConnected() {
  icon.setConnected();
  await CO2Meter.init();
  if (CO2Meter.getDeviceStatus()) {
    createAlarm();
  }
}

function co2MeterDisconnected() {
  broadcastMessage(CO2_METER_UNAVAILABLE);
  icon.setDisconnected();
  clearAlarm();
}

function clearAlarm() {
  console.log('Clear Alarm');
  chrome.alarms.clearAll();
}

async function createAlarm() {
  console.log('Start Alarm');
  chrome.alarms.create(GET_READING_ALARM, {
    delayInMinutes: 0,
    periodInMinutes: (await storage.getIntervalInSeconds()) / 60
  });
}

async function alarmHandler(alarm) {
  if (alarm.name == GET_READING_ALARM) {
    onAlarmGetReading();
  }
}

async function onAlarmGetReading() {
  if (!CO2Meter.getDeviceStatus()) {
    co2MeterDisconnected();
    return;
  }

  try {
    // Use an alarm to keep the service worker alive during the device session.
    // The alarm will be cleared when the session completes.
    chrome.alarms.create(KEEP_ALIVE_FOR_READING_ALARM, {
      delayInMinutes: 0,
      periodInMinutes: 20 / 60
    });
    let reading = await CO2Meter.getReading();
    storage.setCO2Value(reading[CO2_READING_KEY]);
    storage.setTempValue(reading[TEMPERATURE_READING_KEY]);
    await broadcastMessage(NEW_READING_SAVED_MESSAGE);
  } catch (e) {
    if (e == 'The CO2 meter is in 20s calibration!') {
      // If we don't keep service worker alive and the reading interval is large (ex: 60s),
      // the next time the reading alarm goes off, it will hit this exception again because
      // it is a service worker cold start and it needs to initialize CO2 driver.
      keepServiceWorkerAlive(await storage.getIntervalInSeconds());
    }
    console.log('Exception when reading CO2!', e);
  } finally {
    chrome.alarms.clear(KEEP_ALIVE_FOR_READING_ALARM);
  }
}

async function broadcastMessage(message) {
  for (const client of clients.values()) {
    client.postMessage(message);
  }
}

function onPermissionGranted() {
  co2MeterConnected();
}

async function initilize() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message === PERMISSION_GRANTED_MESSAGE) {
      onPermissionGranted();
      broadcastMessage(PERMISSION_GRANTED_MESSAGE);
    }
  });

  chrome.runtime.onConnect.addListener(function (port) {
    port.onDisconnect.addListener(function (port) {
      clients.delete(port);
    });
    clients.add(port);
  });

  await CO2Meter.init();
  chrome.alarms.onAlarm.addListener(alarmHandler);
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
  console.error(
    'WebHID is not available! Use chrome://flags#enable-web-hid-on-extension-service-worker'
  );
}
