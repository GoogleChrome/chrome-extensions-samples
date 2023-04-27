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
 * @filename storage.js
 *
 * @description Use built-in indexedDB for storing CO2 readings and
 * temperature reading. Readings are stored in the form of {time: epochTime,
 * reading: ppm || kelvin}.
 */

import { ExampleTempData, ExampleCO2Data } from './storage-example-data.js';
import { CELSIUS } from './constant.js';

class Storage {
  constructor() {
    this.dbInitialized = new Promise((resolveDBInitialized) => {
      this.db = null;
      this.getValueInRange = this.getValueInRange.bind(this);

      const request = indexedDB.open('TheDB', 2); // Change Version number when changing any database configuration.

      request.onupgradeneeded = (event) => {
        console.log('indexedDB onupgradeneeded.');
        this.db = event.target.result;

        if (!this.db.objectStoreNames.contains('CO2Store')) {
          // Create a CO2Store with a timeIndex.
          const CO2Store = this.db.createObjectStore('CO2Store', {
            autoIncrement: true
          });
          CO2Store.createIndex('CO2TimeIndex', 'time');
        }

        if (!this.db.objectStoreNames.contains('TempStore')) {
          // Create a TemperatureStore with a timeIndex.
          const TemperatureStore = this.db.createObjectStore('TempStore', {
            autoIncrement: true
          });
          TemperatureStore.createIndex('TempTimeIndex', 'time');
        }

        if (!this.db.objectStoreNames.contains('SettingStore')) {
          // Create a SettingStore.
          const setttingStore = this.db.createObjectStore('SettingStore', {
            keyPath: 'key'
          });
          setttingStore.put({ key: 'interval', value: 30 });
          setttingStore.put({ key: 'temperature-unit', value: CELSIUS });
        }

        const transaction = event.target.transaction;
        transaction.oncomplete = () => {
          resolveDBInitialized();
        };
      };

      request.onsuccess = (event) => {
        console.log('Open indexedDB request succeed.');
        this.db = event.target.result;
        resolveDBInitialized();
      };
    });
  }

  /**
   * @description Save CO reading in CO2 reading store in form of
   * {time: epoch_time_stamp, reading: ppm}.
   * @param {*} ppm
   */
  async setCO2Value(ppm) {
    const item = { time: new Date().getTime(), reading: ppm };
    this.addStore('CO2Store', item);
  }

  /**
   * @description Provide time range query for CO2 reading.
   * @param {*} startInMs
   * @param {*} [endMs=new Date().getTime()]
   * @return {*} Promise resolved to a list of { time: epochTimeStamp, reading: * ppm }
   */
  getCO2ValueInRange(startInMs, endMs = new Date().getTime()) {
    return new Promise((resolve, reject) => {
      this.getValueInRange(
        resolve,
        reject,
        startInMs,
        endMs,
        'CO2Store',
        'CO2TimeIndex'
      );
    });
  }

  /**
   * @description Save temperature reading in teperature reading store
   * in form of {time: epoch_time_stamp, reading: ppm}.
   * @param {*} kelvin
   */
  setTempValue(kelvin) {
    const item = { time: new Date().getTime(), reading: kelvin };
    this.addStore('TempStore', item);
  }

  /**
   * @description Provide time range query for temperature reading.
   * @param {*} startInMs
   * @param {*} [endMs=new Date().getTime()]
   * @return {*} Promise resolved to a list of { time: epochTimeStamp, reading: * kelvin }
   */
  getTempValueInRange(startInMs, endMs = new Date().getTime()) {
    return new Promise((resolve, reject) => {
      this.getValueInRange(
        resolve,
        reject,
        startInMs,
        endMs,
        'TempStore',
        'TempTimeIndex'
      );
    });
  }

  /**
   * @description Loads example data into storage.
   */
  addExampleData() {
    this.addStoreArray('TempStore', ExampleTempData);
    this.addStoreArray('CO2Store', ExampleCO2Data);
    location.reload();
  }

  async getIntervalInSeconds() {
    let result = await new Promise((resolve, reject) => {
      this.getKeyValueFromStore('SettingStore', 'interval', resolve, reject);
    });
    return result || 30; // Default.
  }

  async setIntervalInSeconds(interval) {
    await this.putKeyValueToStore('SettingStore', {
      key: 'interval',
      value: interval
    });
  }

  async getTemperatureUnit() {
    let result = await new Promise((resolve, reject) => {
      this.getKeyValueFromStore(
        'SettingStore',
        'temperature-unit',
        resolve,
        reject
      );
    });
    return result || CELSIUS; // Default.
  }

  async setTemperatureUnit(unit) {
    await this.putKeyValueToStore('SettingStore', {
      key: 'temperature-unit',
      value: unit
    });
  }

  async addStore(storeName, item) {
    await this.dbInitialized;
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add(item);
  }

  async addStoreArray(storeName, arrayOfItems) {
    await this.dbInitialized;
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    arrayOfItems.forEach((item) => store.add(item));
  }

  async putKeyValueToStore(storeName, keyValue) {
    await this.dbInitialized;
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(keyValue);
  }

  async getKeyValueFromStore(storeName, key, resolve, reject) {
    await this.dbInitialized;
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = function () {
      resolve(request.result.value);
    };

    request.onerror = function (event) {
      console.log(
        'getKeyValueFromStore error getting item: ',
        event.target.error
      );
      reject(event);
    };
  }

  async getValueInRange(
    resolve,
    reject,
    startTimeInMs,
    endMs,
    name,
    indexName
  ) {
    await this.dbInitialized;
    const transaction = this.db.transaction(name, 'readonly');
    const objectStore = transaction.objectStore(name);

    // Perform a range query on the index
    const index = objectStore.index(indexName);

    // Query for epoch time between start and end both included and resolve with a array of all reading
    const results = [];
    const range = IDBKeyRange.bound(startTimeInMs, endMs, false, false);
    const getRequest = index.openCursor(range);
    getRequest.onsuccess = function (event) {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    transaction.onerror = function (event) {
      reject(event.target.error);
    };
  }
}

export default new Storage();
