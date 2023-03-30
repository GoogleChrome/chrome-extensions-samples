import { get, set, update } from '../third-party/idb-keyval/dist/index.js';

class Storage {
  constructor() {
    this.inited = false;
    this.db = null;
    this.getDB = this.getDB.bind(this);
  }

  async init(){
    this.inited = await get('init');
    if(!this.inited){
      const request = indexedDB.open('TheDB');
      request.onupgradeneeded = (event) => {
        console.log('running onupgradeneeded');
        // Create a new object store with an index
        this.db = event.target.result;
        /*const objectStore = this.db.createObjectStore(OBJECTSTORE, { keyPath: 'id' });*/
        const objectStore = this.db.createObjectStore('CO2ReadingStore', {autoIncrement: true });
        objectStore.createIndex('dateIndex', 'date');

        // Add some data to the object store
        /*
        const data = [
          { date: 1680127957743, reading: 888 },
          { date: 1680127958743, reading: 789 },
          { date: 1680127959743, reading: 989 },
          { date: 1680127960743, reading: 1089 }
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

  getDB(e){
    console.log('getDB store to storage object');
    this.db = e.target.result;
   }


  setCO2Value(ppm) {
    console.log("setCO2Value()", ppm);

    if(!this.db){
      console.log("indexedDB is not ready!!");
      return;
    }

    const transaction = this.db.transaction('CO2ReadingStore', 'readwrite');
    const objectStore = transaction.objectStore('CO2ReadingStore');
    const item = {date: new Date().getTime(), reading: ppm};
    objectStore.add(item);
    transaction.oncomplete = function(event) {
      console.log('Transaction completed');
    };
  };

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