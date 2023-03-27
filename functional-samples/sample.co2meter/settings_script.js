import storage from "./modules/storage.js";

const setupPermissionButton = () => {
  // document.querySelector('#grantPermission').addEventListener('click', grantCO2meterPermission);
  document.querySelector('#grantPermission').onclick = () => {
    // TODO: call CO2 meter driver to request permission.
    // The extension currently only support this model:
    // https://www.co2meter.com/products/co2mini-co2-indoor-air-quality-monitor
    navigator.hid.requestDevice({ filters: [{ vendorId: 1241, productId: 41042 }] }).then((device) => {
      console.log('CO2 meter permission granted!', device[0]);
    })
  };
}

const setupTemperatureUnitButton = () => {
  document.querySelector('#setTemperatureUnit').onclick = () => {
    const metric = document.getElementById("celsius").checked ? 'Celsius' : 'fahrenheit';
    // TODO: to update the storage so that pop up is showing intended metric.
    console.log(`Set temperature metric button clicked, set to use ${metric}`);
    storage.saveTemperatureUnit(metric);
  };
  document.querySelector('#celsius').onchange = () => {
    if (document.getElementById("celsius").checked == true) {
      document.getElementById("fahrenheit").checked = false;
    }
  };
  document.querySelector('#fahrenheit').onchange = () => {
    if (document.getElementById("fahrenheit").checked == true) {
      document.getElementById("celsius").checked = false;
    }
  };
}

const setupIntervalButton = () => {
  // document.querySelector('#grantPermission').addEventListener('click', grantCO2meterPermission);
  document.querySelector('#setInterval').onclick = () => {
    const interval = document.getElementById("interval").value;
    // TODO: to update the storage so that pop up is showing intended metric.
    console.log(`Set CO2 reading interval button clicked, set to use ${interval}s`);
    storage.saveInterval(interval);
  };
}

window.onload = e => {
  console.log('Settings Page loaded');
  setupPermissionButton();
  setupTemperatureUnitButton();
  setupIntervalButton();
};