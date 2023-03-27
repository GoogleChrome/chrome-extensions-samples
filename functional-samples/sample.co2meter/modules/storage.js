class Storage {
    constructor() {}

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