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

import {
  CO2_METER_UNAVAILABLE,
  CO2_METER_AVAILABLE,
  NEW_CO2_READING,
  NEW_TEMP_READING,
  READING_UNKNOWN
} from './modules/constant.js';
import CO2Meter from './modules/co2_meter.js';

window.onload = async () => {
  // Register for messages to update chart upon new data readings.
  chrome.runtime.connect().onMessage.addListener((msg) => {
    switch (msg.type) {
      case NEW_CO2_READING:
        updateCO2Reading(msg.data);
        break;
      case NEW_TEMP_READING:
        updateTempReading(msg.data);
        break;
      case CO2_METER_AVAILABLE:
        updateCO2MeterStatus(true);
        break;
      case CO2_METER_UNAVAILABLE:
        updateCO2MeterStatus(false);
        break;
    }
  });

  // Dialog
  document.getElementById('closeDialogButton').onclick = () => {
    document.getElementById('noDeviceDialog').close();
  };

  await CO2Meter.init(CO2MeterConnected, CO2MeterDisconnected);
  const deviceStatus = await CO2Meter.getDeviceStatus();
  updateCO2MeterStatus(deviceStatus);
};

function updateCO2Reading(co2_reading) {
  let co2_reading_element = document.getElementById('co2_reading');
  if (co2_reading === READING_UNKNOWN) {
    co2_reading_element.textContent = 'unknown';
  } else {
    co2_reading_element.textContent = `${co2_reading} \u33d9`;
  }
}

function updateTempReading(temp_reading) {
  let temp_reading_element = document.getElementById('temp_reading');
  if (temp_reading === READING_UNKNOWN) {
    temp_reading_element.textContent = 'unknown';
  } else {
    const fahrenheit = CO2Meter.tempReadingToFahrenheit(temp_reading);
    temp_reading_element.textContent = `${fahrenheit}\u2109`;
  }
}

function updateCO2MeterStatus(connected) {
  let noDeviceDialog = document.getElementById('noDeviceDialog');
  let co2_meter_connected_status = document.getElementById(
    'co2_meter_connected_status'
  );
  if (connected) {
    noDeviceDialog.close();
    co2_meter_connected_status.textContent = 'connected';
  } else {
    if (!noDeviceDialog.open) {
      noDeviceDialog.showModal();
    }
    co2_meter_connected_status.textContent = 'disconnected';
  }
}

function CO2MeterConnected() {
  updateCO2MeterStatus(true);
}

function CO2MeterDisconnected() {
  updateCO2MeterStatus(false);
}
