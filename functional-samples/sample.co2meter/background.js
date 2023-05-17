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
  REFRESH_CHART,
  PERMISSION_GRANTED_MESSAGE,
  CO2_METER_UNAVAILABLE,
  CO2_METER_AVAILABLE,
  NO_CO2_METER_FOR_READING
} from './modules/constant.js';

const REFRESH_ALARM = 'refreshAlarm';

let clients = new Set();

async function co2MeterConnected() {
  broadcastMessage(CO2_METER_AVAILABLE);
  icon.setConnected();
  startCO2Reading();
}

async function co2MeterDisconnected() {
  CO2Meter.stopReading();
  broadcastMessage(CO2_METER_UNAVAILABLE);
  icon.setDisconnected();
}

async function createRefreshAlarm() {
  console.log('createRefreshAlarm');
  chrome.alarms.create(REFRESH_ALARM, {
    delayInMinutes: 0,
    periodInMinutes: (await storage.getIntervalInSeconds()) / 60
  });
}

async function alarmHandler(alarm) {
  if (alarm.name == REFRESH_ALARM) {
    onRefreshAlarm();
  }
}

async function onRefreshAlarm() {
  console.log('onRefreshAlarm');
  await broadcastMessage(REFRESH_CHART);

  // This is for detecting when the permission is revoked.
  // There is no callback for permission revocation, so we need to poll the status periodically.
  const deviceStatus = await CO2Meter.getDeviceStatus();
  if (!deviceStatus) {
    co2MeterDisconnected();
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

async function startCO2Reading() {
  try {
    await CO2Meter.startReading();
  } catch (e) {
    console.log('Exception when startCO2Reading:', e);
    if (e === NO_CO2_METER_FOR_READING) {
      co2MeterDisconnected();
    }
  }
}

async function initilize() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message === PERMISSION_GRANTED_MESSAGE) {
      onPermissionGranted();
      broadcastMessage(CO2_METER_AVAILABLE);
    }
  });

  chrome.runtime.onConnect.addListener(function (port) {
    port.onDisconnect.addListener(function (port) {
      clients.delete(port);
    });
    clients.add(port);
  });

  await CO2Meter.init(
    co2MeterConnected,
    co2MeterDisconnected,
    storage.setCO2Value.bind(storage),
    storage.setTempValue.bind(storage)
  );
  startCO2Reading();
  chrome.alarms.onAlarm.addListener(alarmHandler);
  createRefreshAlarm();
}

if (navigator.hid) {
  initilize();
} else {
  console.error(
    'WebHID is not available! Use chrome://flags#enable-web-hid-on-extension-service-worker'
  );
}
