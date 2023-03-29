import { get, set, update } from '../third-party/idb-keyval/dist/index.js';

class Storage {
  constructor() {
  }

  setCO2Value(ppm) {
    console.log("setCO2Value()", ppm);
  };

  setTempValue(kelvin) {
    console.log("setTempValue()", kelvin);
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