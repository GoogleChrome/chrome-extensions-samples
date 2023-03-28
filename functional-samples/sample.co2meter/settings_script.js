import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";

const setupPermissionButton = () => {
  // document.querySelector('#grantPermission').addEventListener('click', grantCO2meterPermission);
  document.querySelector('#grantPermission').onclick = () => {
    CO2Meter.requestPermission();
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