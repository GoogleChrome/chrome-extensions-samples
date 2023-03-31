// co2_meter.js

/*
Description:
CO2Meter provides methods for accessing status and data of a CO2 meter.
When creating a CO2Meter, it has to await `init()` to finish before questing device status.

async init(useVirtual = false):
`init()` must be called right after CO2Meter created. `useVirtual` used to indicate whether 
to use a virtual CO2meter or not.

getDeviceStatus():
It returns true when device is connected and granted with permission.
Or it returns false instead.
*/

import icon from "./icon.js";
import {
    CO2_READING_KEY, TEMPERATURE_READING_KEY,
    PERMISSION_GRANTED_MESSAGE
  } from "./constant.js";

const key = new Uint8Array([0xc4, 0xc6, 0xc0, 0x92, 0x40, 0x23, 0xdc, 0x96]);

function parseReport(report) {
    let data = new Uint8Array(report.data.buffer,
        report.data.byteOffset,
        report.data.byteLength);

    const op = data[0];
    let val = data[1] << 8 | data[2];

    if (op == 0x50) {
        console.log(`Current CO2 reading is ${val}`);
        return {[CO2_READING_KEY]: val}
    } else if (op == 0x42) {
        val = val / 16;
        console.log(`Current Temp reading is ${val}`);
        return {[TEMPERATURE_READING_KEY]: val}
    } 
    return {};
}

function isReadingReady(reading) {
    return reading && reading.hasOwnProperty(CO2_READING_KEY) && reading.hasOwnProperty(TEMPERATURE_READING_KEY);
}

class CO2Meter {
    constructor() {
        this.device = null;
        this.useVitual = false;
        this.connectClientCB = null;
        this.disconnectClientCB = null;
        this.connectHanlder = this.connectHanlder.bind(this);
        this.disconnectHandler = this.disconnectHandler.bind(this);
        this.reading = null;
        this.calibration = false;        
    }

    startCalibration() {
        this.calibration = true;
        // Assuming the device takes 20s for calibration.
        setTimeout(() => {
            this.calibration = false;
        }, 20000);    
    }

    async init(useVirtual = false) {
        const devices = await navigator.hid.getDevices();
        this.useVitual = useVirtual;
        if (devices.length == 1) this.device = devices[0];
        navigator.hid.addEventListener("connect", this.connectHanlder);
        navigator.hid.addEventListener("disconnect", this.disconnectHandler);
        // Assuming the worst case that user just plugged in while start
        // the extension at the same time.
        this.startCalibration();        
        console.log('CO2Meter init() done');
    }

    registerCallback(connectCallback, disconnectCallback) {
        this.connectClientCB = connectCallback;
        this.disconnectClientCB = disconnectCallback;
    }

    deregisterCallback() {
        this.connectClientCB = null;
        this.disconnectClientCB = null;
    }

    requestPermission() {
        // The extension currently only support this model:
        // https://www.co2meter.com/products/co2mini-co2-indoor-air-quality-monitor
        navigator.hid.requestDevice({ filters: [{ vendorId: 1241, productId: 41042 }] }).then((device) => {        
            console.log('CO2 meter permission granted!', device[0]);
            chrome.runtime.sendMessage(PERMISSION_GRANTED_MESSAGE);
        })
    }

    connectHanlder(e) {
        this.device = e.device;
        if (this.connectClientCB
            && typeof this.connectClientCB === 'function') {
            this.connectClientCB();
        }
        this.startCalibration();        
    }

    disconnectHandler() {
        if (this.device) {
            this.device.close();
        }
        this.device = null;
        this.reading = null;
        if (this.disconnectClientCB &&
            typeof this.disconnectClientCB === 'function') {
            this.disconnectClientCB();
        }
    }

    async getCO2Reading() {
        if (this.useVitual) {
            return Promise.resolve(999);
        }

        if(this.reading) {
            return Promise.reject("Still waiting previous reading promise resolved!");
        }

        if (this.calibration) {
            return Promise.reject("The CO2 meter is in calibration!");
        }

        this.reading = {};

        return new Promise(async (resolve, reject) => {
            const onInputReport = async (report) => {
                this.reading = Object.assign(this.reading, parseReport(report));
                if (isReadingReady(this.reading)) {
                    clearTimeout(timeoutID);
                    this.device.removeEventListener('inputreport', onInputReport);
                    await this.device.close();
                    resolve(this.reading);                    
                    this.reading = null;   
                }
            }

            // Currently we have a timeout for 10 sec if CO2 report is not received.
            const timeoutID = setTimeout(() => {
                // this.device might be null if the device is disconnected.
                if (this.device) {
                    this.device.removeEventListener('inputreport', onInputReport);
                }
                reject('Timeout for CO2 meter reading');
                this.reading = null;
            }, 10000);            

            try {
                this.device.addEventListener('inputreport', onInputReport);
                await this.device.open();
                await this.device.sendFeatureReport(0, key);
            } catch (e) {
                console.log('CO2 reading exception:', e);
                this.device.removeEventListener('inputreport', onInputReport);                
                await this.device.close();
                reject('Fail to open CO2 meter for reading');
                return;
            }
        })
    }

    getDeviceStatus() {
        return this.useVitual || Boolean(this.device);
    }
}

export default new CO2Meter();
