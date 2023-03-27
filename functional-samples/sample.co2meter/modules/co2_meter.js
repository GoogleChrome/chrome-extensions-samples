// co2_meter.js

let device = null;
let resolver = null;
const key = new Uint8Array([0xc4, 0xc6, 0xc0, 0x92, 0x40, 0x23, 0xdc, 0x96]);
// hasPermision 

async function getCO2Reading() {
    if (!navigator.hid) {
        console.log(`WebHID is not enabled.`);
        return;
    }
    let devices;
    await navigator.hid.getDevices().then((devices_) => devices = devices_);

    if (!devices) {
        console.log(`There is no granted HID device, do users grant permission?.`);
        return;
    }

    device = devices[0];

    try {
        device.addEventListener('inputreport', onInputReport);
        await device.open();
        await device.sendFeatureReport(0, key);
    } catch {
        device.close().then(() => { });
        device.removeEventListener('inputreport', onInputReport);
    }
    console.log('debug');

    return new Promise((resolve) => {
        resolver = resolve;
    })
}

function onInputReport(report) {
    const date = new Date();

    let data = new Uint8Array(report.data.buffer,
        report.data.byteOffset,
        report.data.byteLength);

    const op = data[0];
    let val = data[1] << 8 | data[2];

    // Currently we ignore all other report except for CO2 reading.
    if (op == 0x50) {
        console.log(`Current CO2 reading is ${val}`);
        resolver(val);
    }
}

export { getCO2Reading };
