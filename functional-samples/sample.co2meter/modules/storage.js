import { get, set, update } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

class Storage {
    constructor() {
        // TODO: Move from proof of concept to actual usage of storage.
        update("storage-test-counter", (val) => (val || 0) + 1);
        get("storage-test-counter").then(val => console.warn("storage-test-counter", val));
    }

    saveCO2Value(kelvin) {
        console.log("saveCO2Value()", kelvin);
    };

    getInterval() {
        const storedInterval = 10;
        console.log(`getInterval() ${storedInterval}`);
        return storedInterval;
    }
    
    saveInterval(interval) {
        console.log("saveInterval()", interval);
    }
    
    saveTemperatureUnit(metric) {
        console.log("saveTemperatureUnit()", metric);
    }
};

export default new Storage();