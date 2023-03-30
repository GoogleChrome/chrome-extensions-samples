import { get, set, update } from '../third-party/idb-keyval/dist/index.js';

class Storage {
  constructor() {
    this.doneInit = false;
    this.db = null;
    this.getDB = this.getDB.bind(this);
  }

  async init() {
    this.doneInit = await get('init');
    if (!this.doneInit) {
      const request = indexedDB.open('TheDB');
      request.onupgradeneeded = (event) => {
        console.log('indexedDB creates CO2ReadingStore and indexed with time');
        // Create a new object store with an index
        this.db = event.target.result;
        const objectStore = this.db.createObjectStore('CO2ReadingStore', { autoIncrement: true });
        objectStore.createIndex('timeIndex', 'time');

        // Some dummy data for testing the object store
        /*
        const data = [
          { time: 1680127957743, reading: 888 },
          { time: 1680127958743, reading: 789 },
          { time: 1680127959743, reading: 989 },
          { time: 1680127960743, reading: 1089 }
        ];

        data.forEach(item => {
          objectStore.add(item);
        });*/
      };
      set('init', true);
    } else {
      console.log("this.inited === false");
      const request = indexedDB.open('TheDB');
      request.onsuccess = this.getDB;
    }
  }

  getDB(e) {
    console.log('getDB store to storage object');
    this.db = e.target.result;
  }


  setCO2Value(ppm) {
    console.log("setCO2Value()", ppm);

    if (!this.db) {
      console.log("indexedDB is not ready!!");
      return;
    }

    const transaction = this.db.transaction('CO2ReadingStore', 'readwrite');
    const objectStore = transaction.objectStore('CO2ReadingStore');
    const item = { time: new Date().getTime(), reading: ppm };
    objectStore.add(item);
  };

  getCO2ValueInRange(start, end = new Date().getTime()) {
    return new Promise(function (resolve, reject) {
      const self = this;
      const transaction = self.db.transaction('CO2ReadingStore', 'readonly');
      const objectStore = transaction.objectStore('CO2ReadingStore');

      // Perform a range query on the index
      const index = objectStore.index('timeIndex');

      // Query for epoch time between start and end both included and resolve with a array of all reading 
      const results = [];
      const range = IDBKeyRange.bound(start, end, false, false);
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
    }.bind(this));
  }


  setTempValue(kelvin) {
    console.log("setTempValue()", kelvin);
  };

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
};

export default new Storage();