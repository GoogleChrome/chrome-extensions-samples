// Copyright 2023 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import storage from './modules/storage.js';
import CO2Meter from './modules/co2_meter.js';
import { CELSIUS, FAHRENHEIT } from './modules/constant.js';

window.onload = async () => {
  // Permission
  document.getElementById('grantPermissionButton').onclick = () => {
    CO2Meter.requestPermission();
  };

  // Temperature Unit
  const isCelsius = (await storage.getTemperatureUnit()) == CELSIUS;
  let celsiusInput = document.getElementById('celsiusInput');
  let fahrenheitInput = document.getElementById('fahrenheitInput');
  celsiusInput.checked = isCelsius;
  fahrenheitInput.checked = !isCelsius;
  celsiusInput.onclick = fahrenheitInput.onclick = async () => {
    let newValue = celsiusInput.checked ? CELSIUS : FAHRENHEIT;
    let previous = await storage.getTemperatureUnit();
    if (newValue != previous) {
      storage.setTemperatureUnit(newValue);
      location.reload();
    }
  };

  // Interval
  let intervalInput = document.getElementById('intervalInput');
  intervalInput.value = await storage.getIntervalInSeconds();
  intervalInput.onchange = () => {
    const interval = intervalInput.value;
    storage.setIntervalInSeconds(interval);
  };

  // Example Data
  document.getElementById('updateChartWithExampleDataButton').onclick = () => {
    storage.addExampleData();
  };
};
