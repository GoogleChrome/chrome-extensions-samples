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


const key = new Uint8Array([0xc4, 0xc6, 0xc0, 0x92, 0x40, 0x23, 0xdc, 0x96]);

class CO2Meter {
    constructor() {
        this.device = null;
        this.resolver = null;
        this.useVitual = false;
        this.onInputReport = this.onInputReport.bind(this);
        this.connectClientCB = null;
        this.disconnectClientCB = null;
        this.connectHanlder = this.connectHanlder.bind(this);
        this.disconnectHandler = this.disconnectHandler.bind(this);
    }

    async init(useVirtual = false) {
        const devices = await navigator.hid.getDevices();
        this.useVitual = useVirtual;
        if (devices.length == 1) this.device = devices[0];
        navigator.hid.addEventListener("connect", this.connectHanlder);
        navigator.hid.addEventListener("disconnect", this.disconnectHandler);
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
        })
    }

    connectHanlder(e) {
        this.device = e.device;
        if (this.connectClientCB
            && typeof this.connectClientCB === 'function') {
            this.connectClientCB();
        }
    }

    disconnectHandler() {
        this.device = null;
        if (this.disconnectClientCB &&
            typeof this.disconnectClientCB === 'function') {
            this.disconnectClientCB();
        }
    }

    async getCO2Reading() {
        if (this.useVitual) {
            return Promise.resolve(999);
        }

        if (!navigator.hid) {
            console.log(`WebHID is not enabled.`);
            return;
        }

        try {
            this.device.addEventListener('inputreport', this.onInputReport);
            await this.device.open();
            await this.device.sendFeatureReport(0, key);
        } catch {
            this.device.close().then(() => { });
            this.device.removeEventListener('inputreport', this.onInputReport);
        }


        return new Promise((resolve, reject) => {
            this.resolver = resolve;
            // Currently we have a timeout for 10 sec if CO2 report is not received.
            setTimeout(() => {
                reject('Timeout for CO2 reading');
            }, 10000);
        })
    }

    getDeviceStatus() {
        return this.useVitual || Boolean(this.device);
    }

    onInputReport(report) {
        const date = new Date();

        let data = new Uint8Array(report.data.buffer,
            report.data.byteOffset,
            report.data.byteLength);

        const op = data[0];
        let val = data[1] << 8 | data[2];

        // Currently we ignore all other report except for CO2 reading.
        if (op == 0x50) {
            console.log(`Current CO2 reading is ${val}`);
            this.resolver(val);
            this.device.removeEventListener('inputreport', this.onInputReport);
        }
    }
}

export default new CO2Meter();
