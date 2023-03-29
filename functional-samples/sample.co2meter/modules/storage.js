import { get, set, update } from '../third-party/idb-keyval/dist/index.js';

class Storage {
    constructor() {
        // TODO: Move from proof of concept to actual usage of storage.
        update("storage-test-counter", (val) => (val || 0) + 1);
        get("storage-test-counter").then(val => console.warn("storage-test-counter", val));
    }

    saveCO2Value(kelvin) {
        console.log("saveCO2Value()", kelvin);
    };

    async getInterval() {
        const storedInterval = await get("interval") || 60;
        console.log("getInterval()", storedInterval);
        return storedInterval;
    }
    
    async saveInterval(interval) {
        console.log("saveInterval()", interval);
        return await set("interval", interval);
    }
    
    saveTemperatureUnit(metric) {
        console.log("saveTemperatureUnit()", metric);
    }
};

export default new Storage();