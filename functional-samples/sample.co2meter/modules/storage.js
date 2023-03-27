class Storage {
    constructor() {}

    saveCO2Value(kelvin) {
        console.log("saveCO2Value()", kelvin);
    };

    saveInterval(interval) {
        console.log("saveInterval()", interval);
    }
    
    saveTemperatureUnit(metric) {
        console.log("saveTemperatureUnit()", metric);
    }
};

export default new Storage();