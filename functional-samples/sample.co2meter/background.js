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

import icon from "./modules/icon.js";
import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";
import {
  CO2_READING_KEY, TEMPERATURE_READING_KEY, NEW_READING_SAVED_MESSAGE
} from "./modules/constant.js";

var clients = {};

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
    storage.setCO2Value(reading[CO2_READING_KEY]);
    storage.setTempValue(reading[TEMPERATURE_READING_KEY]);
    await broadcastNewReading();
  } catch (e) {
    console.log('Exception when reading CO2!', e);
  }
}

async function broadcastNewReading() {
  for (let client in clients) {
    clients[client].postMessage(NEW_READING_SAVED_MESSAGE);
  }
}

async function initilize() {
  chrome.runtime.onConnect.addListener(function (port) {
    console.log(`${port.name} connected`);
    port.onDisconnect.addListener(function (port) {
      console.log(`${port.name} disconnected`);
      delete clients[port.name];
    });
    clients[port.name] = port;
  });


  await CO2Meter.init();
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
  console.error('WebHID is not available!');
}
