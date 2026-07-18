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
import CO2Meter from './modules/co2_meter.js';
import {
  PERMISSION_GRANTED_MESSAGE,
  CO2_METER_UNAVAILABLE,
  CO2_METER_AVAILABLE,
  NO_CO2_METER_FOR_READING,
  NEW_CO2_READING,
  NEW_TEMP_READING,
  READING_UNKNOWN
} from './modules/constant.js';

let clients = new Set();

let last_co2_reading = READING_UNKNOWN;
let last_temp_reading = READING_UNKNOWN;

async function co2MeterConnected() {
  broadcastMessage(CO2_METER_AVAILABLE);
  icon.setConnected();
  startCO2Reading();
}

async function co2MeterDisconnected() {
  CO2Meter.stopReading();
  broadcastMessage(CO2_METER_UNAVAILABLE);
  icon.setDisconnected();
  last_co2_reading = READING_UNKNOWN;
  last_temp_reading = READING_UNKNOWN;
  await broadcastMessage(NEW_CO2_READING, last_co2_reading);
  await broadcastMessage(NEW_TEMP_READING, last_temp_reading);
}

async function broadcastMessage(type, data) {
  for (const client of clients.values()) {
    client.postMessage({
      type: type,
      data: data
    });
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

async function OnCO2Reading(co2_reading) {
  last_co2_reading = co2_reading;
  await broadcastMessage(NEW_CO2_READING, co2_reading);
}

async function OnTempReading(temp_reading) {
  last_temp_reading = temp_reading;
  await broadcastMessage(NEW_TEMP_READING, temp_reading);
}

async function initialize() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message === PERMISSION_GRANTED_MESSAGE) {
      onPermissionGranted();
      broadcastMessage(CO2_METER_AVAILABLE);
    }
  });

  chrome.runtime.onConnect.addListener(async function (port) {
    port.onDisconnect.addListener(function (port) {
      clients.delete(port);
    });
    clients.add(port);
    await broadcastMessage(NEW_CO2_READING, last_co2_reading);
    await broadcastMessage(NEW_TEMP_READING, last_temp_reading);
  });

  await CO2Meter.init(
    co2MeterConnected,
    co2MeterDisconnected,
    OnCO2Reading,
    OnTempReading
  );
  startCO2Reading();
}

if (navigator.hid) {
  initialize();
} else {
  console.error(
    'WebHID is not available! Use chrome://flags#enable-web-hid-on-extension-service-worker'
  );
}
