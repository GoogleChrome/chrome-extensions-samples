import storage from "./modules/storage.js";
import CO2Meter from "./modules/co2_meter.js";

window.onload = async () => {
  console.info('Settings Page loading');

  // Permission
  grantPermissionButton.onclick = () => {
    CO2Meter.requestPermission();
  };

  // Temperature Unit
  const isCelsius = await storage.getTemperatureUnit() == "Celsius";
  celsiusInput.checked = isCelsius;
  fahrenheitInput.checked = !isCelsius;
  celsiusInput.onclick = fahrenheitInput.onclick = () => {
    storage.setTemperatureUnit(celsiusInput.checked ? "Celsius" : "Fahrenheit");
  };

  // Interval
  intervalInput.value = await storage.getIntervalInSeconds();
  intervalInput.onchange = () => {
    const interval = intervalInput.value;
    storage.setIntervalInSeconds(interval);
  };

  // Example Data
  updateChartWithExampleDataButton.onclick = () => {
    storage.addExampleData();
  }
};