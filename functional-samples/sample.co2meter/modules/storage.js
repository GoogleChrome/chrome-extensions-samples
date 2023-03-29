import { get, set, update } from '../third-party/idb-keyval/dist/index.js';

class Storage {
  constructor() {
  }

  setCO2Value(kelvin) {
    console.log("setCO2Value()", kelvin);
  };

  async getInterval() {
    return await get("interval") || 60;
  }
  
  async setInterval(interval) {
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