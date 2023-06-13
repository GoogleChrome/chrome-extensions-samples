// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @filename co2_meter.js
 *
 * @description CO2Meter provides methods for accessing status and data of a
 * CO2 meter. When creating a CO2Meter, it has to await `init()` to finish
 * before quering device status.
 */

import { PERMISSION_GRANTED_MESSAGE } from './constant.js';

const key = new Uint8Array([0xc4, 0xc6, 0xc0, 0x92, 0x40, 0x23, 0xdc, 0x96]);

function KelvinToFahrenheit(k) {
  return Math.trunc(((k - 273.15) * 9) / 5 + 32);
}

class CO2Meter {
  constructor() {
    this.device = null;
    this.connectClientCB = null;
    this.disconnectClientCB = null;
    this.co2ReadingClientCB = null;
    this.tempReadingClientCB = null;
    this.connectHandler = this.connectHandler.bind(this);
    this.disconnectHandler = this.disconnectHandler.bind(this);
    this.onInputReport = this.onInputReport.bind(this);
  }

  /**
   * @description This function initializes the CO2Meter object.
   */
  async init(
    connectCallback = null,
    disconnectCallback = null,
    co2ReadingCallback = null,
    tempReadingCallback = null
  ) {
    this.connectClientCB = connectCallback;
    this.disconnectClientCB = disconnectCallback;
    this.co2ReadingClientCB = co2ReadingCallback;
    this.tempReadingClientCB = tempReadingCallback;
    navigator.hid.addEventListener('connect', this.connectHandler);
    navigator.hid.addEventListener('disconnect', this.disconnectHandler);
    console.log('CO2Meter init() done');
  }

  async startReading() {
    if (this.device) {
      console.log('CO2 reading has already started!');
      return;
    }
    const devices = await navigator.hid.getDevices();
    if (devices.length == 0) {
      throw 'No CO2 meter for reading!';
    }
    this.device = devices[0];

    try {
      await this.device.open();
      await this.device.sendFeatureReport(0, key);
    } catch (e) {
      console.log('CO2 reading exception:', e);
      await this.device.close();
      this.device = null;
      throw 'Fail to open CO2 meter for reading!';
    }

    this.device.addEventListener('inputreport', this.onInputReport);
  }

  async stopReading() {
    if (this.device) {
      this.device.removeEventListener('inputreport', this.onInputReport);
      await this.device.close();
      this.device = null;
    }
  }

  onInputReport(report) {
    let data = new Uint8Array(
      report.data.buffer,
      report.data.byteOffset,
      report.data.byteLength
    );

    const op = data[0];
    let val = (data[1] << 8) | data[2];

    if (op == 0x50) {
      console.log(`Current CO2 reading is ${val}`);
      if (this.co2ReadingClientCB) {
        this.co2ReadingClientCB(val);
      }
    } else if (op == 0x42) {
      val = val / 16;
      console.log(`Current Temp reading is ${val}`);
      if (this.tempReadingClientCB) {
        this.tempReadingClientCB(val);
      }
    }
  }

  /**
   * @description Request user to grant permission for using CO2 meter.
   * The extension currently only support this model:
   * https://www.co2meter.com/products/co2mini-co2-indoor-air-quality-monitor
   */
  async requestPermission() {
    const devices = await navigator.hid.requestDevice({
      filters: [{ vendorId: 1241, productId: 41042 }]
    });
    console.log('CO2 meter permission granted!', devices[0]);
    chrome.runtime.sendMessage(PERMISSION_GRANTED_MESSAGE);
  }

  connectHandler() {
    if (this.connectClientCB && typeof this.connectClientCB === 'function') {
      this.connectClientCB();
    }
  }

  disconnectHandler() {
    if (this.device) {
      this.device.close();
    }
    this.device = null;
    if (
      this.disconnectClientCB &&
      typeof this.disconnectClientCB === 'function'
    ) {
      this.disconnectClientCB();
    }
  }

  /**
   * @description Get Device connected status.
   * @return {Boolean}
   */
  async getDeviceStatus() {
    const devices = await navigator.hid.getDevices();
    return devices.length > 0;
  }

  tempReadingToFahrenheit(temp_reading) {
    return KelvinToFahrenheit(temp_reading);
  }
}

export default new CO2Meter();
