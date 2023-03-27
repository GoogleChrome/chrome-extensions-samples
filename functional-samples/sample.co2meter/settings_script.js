import storage from "./modules/storage.js";
storage.saveCO2Value(1234); // TODO: Replace this test with actual usage.

const createGrantDeviceButton = () => {
  let divElement = document.createElement('div');
  const buttonElement = document.createElement('button');
  buttonElement.appendChild(document.createTextNode(`Grant CO2 meter permission`));
  buttonElement.onclick = () => {
    // The extension currently only support this model:
    // https://www.co2meter.com/products/co2mini-co2-indoor-air-quality-monitor
    navigator.hid.requestDevice({ filters: [{ vendorId: 1241, productId: 41042 }] }).then((device) => {
      console.log('CO2 meter permission granted!', device[0]);
    })
  };
  divElement.appendChild(buttonElement);
  return divElement;
}

const createTemperatureMetricButton = () => {
  let divElement = document.createElement('div');
  const buttonElement = document.createElement('button');
  buttonElement.appendChild(document.createTextNode(`Set temperature metric`));
  buttonElement.onclick = () => {
    const metric = document.getElementById("celsius").checked ? 'Celsius' : 'fahrenheit';
    // TODO: to update the storage so that pop up is showing intended metric.
    console.log(`Set temperature metric button clicked, set to use ${metric}`);
  };

  let celsiusInputElement = document.createElement('input');
  celsiusInputElement.setAttribute('type', 'radio');
  celsiusInputElement.setAttribute('id', 'celsius');
  celsiusInputElement.setAttribute('name', 'celsius');
  celsiusInputElement.onchange = () => {
    if (document.getElementById("celsius").checked == true) {
      document.getElementById("fahrenheit").checked = false;
    }
  }
  let celsiusLabelElement = document.createElement('label');
  celsiusLabelElement.setAttribute('for', 'celsius');
  celsiusLabelElement.innerHTML = 'Celsius';

  let fahrenheitInputElement = document.createElement('input');
  fahrenheitInputElement.setAttribute('type', 'radio');
  fahrenheitInputElement.setAttribute('id', 'fahrenheit');
  fahrenheitInputElement.setAttribute('name', 'fahrenheit');
  fahrenheitInputElement.onchange = () => {
    if (document.getElementById("fahrenheit").checked == true) {
      document.getElementById("celsius").checked = false;
    }
  }
  let FahrenheitLabelElement = document.createElement('label');
  FahrenheitLabelElement.setAttribute('for', 'fahrenheit');
  FahrenheitLabelElement.innerHTML = 'fahrenheit';

  divElement.appendChild(buttonElement);
  divElement.appendChild(celsiusInputElement);
  divElement.appendChild(celsiusLabelElement);
  divElement.appendChild(fahrenheitInputElement);
  divElement.appendChild(FahrenheitLabelElement);
  return divElement;
}

const createIntervalButton = () => {
  let divElement = document.createElement('div');
  const buttonElement = document.createElement('button');
  buttonElement.appendChild(document.createTextNode(`Set CO2 reading interval (in seconds)`));
  buttonElement.onclick = () => {
    const interval = document.getElementById("interval").value;
    // TODO: to update the storage so that pop up is showing intended metric.
    console.log(`Set CO2 reading interval button clicked, set to use ${interval}s`);
  };

  let inputElement = document.createElement('input');
  inputElement.setAttribute('type', 'number');
  inputElement.setAttribute('id', 'interval');
  inputElement.setAttribute('name', 'interval');
  inputElement.setAttribute('value', 10);

  divElement.appendChild(buttonElement);
  divElement.appendChild(inputElement);
  return divElement;
}

window.onload = e => {
  console.log('Settings Page loaded');
  document.body.appendChild(createGrantDeviceButton());
  document.body.appendChild(createTemperatureMetricButton());
  document.body.appendChild(createIntervalButton());
};
