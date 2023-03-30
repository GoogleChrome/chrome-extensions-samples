import { get, set, update } from '../third-party/idb-keyval/dist/index.js';

/*
Storage use built-in indexedDB for storing CO2 readings and temperature reading. Readings are stored in form of {time: epochTime, reading: ppm || kelvin}.

`getCO2ValueInRange` and `getTempValueInRange`:
 take start epoch time and end epoch time (default as Date()) and return promise resolved to an array of {time, reading} pairs.
*/

class Storage {
  constructor() {
    this.dbInitialized = new Promise((resolveDBInitialized) => {
        this.db = null;
        this.getValueInRange = this.getValueInRange.bind(this);
    
        const request = indexedDB.open('TheDB');
    
        request.onupgradeneeded = (event) => {
          console.log('indexedDB onupgradeneeded.');
    
          // Create a CO2Store with a timeIndex.
          this.db = event.target.result;
          const CO2Store = this.db.createObjectStore('CO2Store', { autoIncrement: true });
          CO2Store.createIndex('CO2TimeIndex', 'time');
    
          // Create a TemperatureStore with a timeIndex.
          const TemperatureStore = this.db.createObjectStore('TempStore', { autoIncrement: true });
          TemperatureStore.createIndex('TempTimeIndex', 'time');

          resolveDBInitialized();
        };
    
        request.onsuccess = (event) => {
          console.log('Open indexedDB request succeed.');
          this.db = event.target.result;
          resolveDBInitialized();
        };    
    })
  }

  setCO2Value(ppm) {
    console.log("setCO2Value()", ppm);
    const item = { time: new Date().getTime(), reading: ppm };
    this.updateStore('CO2Store', item);
  };

  getCO2ValueInRange(startTimeInMs, endMs = new Date().getTime()) {
    return new Promise((resolve, reject) => {
      this.getValueInRange(resolve, reject, startTimeInMs, endMs, 'CO2Store', 'CO2TimeIndex');
    });
  }

  setTempValue(kelvin) {
    console.log("setTempValue()", kelvin);
    const item = { time: new Date().getTime(), reading: kelvin };
    this.updateStore('TempStore', item);
  };

  getTempValueInRange(startTimeInMs, endMs = new Date().getTime()) {
    return new Promise((resolve, reject) => {
      this.getValueInRange(resolve, reject, startTimeInMs, endMs, 'TempStore', 'TempTimeIndex');
    });
  }

  async getIntervalInSeconds() {
    return await get("interval") || 60;
  }

  async setIntervalInSeconds(interval) {
    console.log("setInterval()", interval);
    return await set("interval", interval);
  }

  async getTemperatureUnit() {
    return await get("temperature-unit") || "Celsius";
  }

  async setTemperatureUnit(metric) {
    console.log("setTemperatureUnit()", metric);
    set("temperature-unit", metric);
  }

  updateStore(storeName, item) {
    if (!this.db) {
      console.log("indexedDB is not ready!!");
      return;
    }
    const transaction = this.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.add(item);
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