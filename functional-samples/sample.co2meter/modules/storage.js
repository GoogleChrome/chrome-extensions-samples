/**
 * @fileoverview Use built-in indexedDB for storing CO2 readings and temperature reading. Readings are stored in the form of {time: epochTime, reading: ppm || kelvin}.
 * 
 * @description Storage is backed by indexedDB for storing CO2/Temperature readings and support range query.
 */

class Storage {
  constructor() {
    this.dbInitialized = new Promise((resolveDBInitialized) => {
      this.db = null;
      this.getValueInRange = this.getValueInRange.bind(this);

      const request = indexedDB.open('TheDB',
        2); // Change Version number when changing any database configuration.

      request.onupgradeneeded = (event) => {
        console.log('indexedDB onupgradeneeded.');
        this.db = event.target.result;

        if (!this.db.objectStoreNames.contains('CO2Store')) {
          // Create a CO2Store with a timeIndex.
          const CO2Store = this.db.createObjectStore('CO2Store', { autoIncrement: true });
          CO2Store.createIndex('CO2TimeIndex', 'time');
        }

        if (!this.db.objectStoreNames.contains('TempStore')) {
          // Create a TemperatureStore with a timeIndex.
          const TemperatureStore = this.db.createObjectStore('TempStore', { autoIncrement: true });
          TemperatureStore.createIndex('TempTimeIndex', 'time');
        }

        if (!this.db.objectStoreNames.contains('SettingStore')) {
          // Create a SettingStore.
          const setttingStore = this.db.createObjectStore('SettingStore', { keyPath: 'key' });
          setttingStore.put({ key: 'interval', value: 60 });
          setttingStore.put({ key: 'temperature-unit', value: "Celsius" });
        }

        resolveDBInitialized();
      };

      request.onsuccess = (event) => {
        console.log('Open indexedDB request succeed.');
        this.db = event.target.result;
        resolveDBInitialized();
      };
    })
  }

  async setCO2Value(ppm) {
    console.log("setCO2Value()", ppm);
    const item = { time: new Date().getTime(), reading: ppm };
    this.addStore('CO2Store', item);
  };

  // returns Promise with array similar to [{"time":1680213918765,"reading":561},...]
  getCO2ValueInRange(startTimeInMs, endMs = new Date().getTime()) {
    return new Promise((resolve, reject) => {
      this.getValueInRange(resolve, reject, startTimeInMs, endMs, 'CO2Store', 'CO2TimeIndex');
    });
  }

  setTempValue(kelvin) {
    console.log("setTempValue()", kelvin);
    const item = { time: new Date().getTime(), reading: kelvin };
    this.addStore('TempStore', item);
  };

  // returns Promise with array similar to [{"time":1680213918765,"reading":297.5},...]
  getTempValueInRange(startTimeInMs, endMs = new Date().getTime()) {
    return new Promise((resolve, reject) => {
      this.getValueInRange(resolve, reject, startTimeInMs, endMs, 'TempStore', 'TempTimeIndex');
    });
  }

  getIntervalInSeconds() {
    return new Promise((resolve, reject) => {
      this.getKeyValueFromStore('SettingStore', 'interval', resolve, reject);
    });
  }

  async setIntervalInSeconds(interval) {
    console.log("setInterval()", interval);
    await this.putKeyValueToStore('SettingStore', { key: 'interval', value: interval });
  }

  getTemperatureUnit() {
    return new Promise((resolve, reject) => {
      this.getKeyValueFromStore('SettingStore', 'temperature-unit', resolve, reject);
    });
  }

  async setTemperatureUnit(unit) {
    console.log("setTemperatureUnit()", unit);
    await this.putKeyValueToStore('SettingStore', { key: 'temperature-unit', value: unit });
  }

  async addStore(storeName, item) {
    await this.dbInitialized;
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add(item);
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

    request.onsuccess = function (event) {
      resolve(request.result.value);
    };

    request.onerror = function (event) {
      console.log('getKeyValueFromStore error getting item: ', event.target.error);
      reject(event);
    };
  }

  async getValueInRange(resolve, reject, startTimeInMs, endMs, name, indexName) {
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
};

export default new Storage();
