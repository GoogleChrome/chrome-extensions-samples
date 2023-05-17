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
import {
  REFRESH_CHART,
  CO2_METER_UNAVAILABLE,
  CELSIUS,
  CO2_METER_AVAILABLE
} from './modules/constant.js';
import CO2Meter from './modules/co2_meter.js';

let lastChartUpdateTimeMs = new Date(
  new Date().getTime() - 7 * 24 * 60 * 60 * 1000
).getTime(); // Initialize to one week ago.

let chart = null;

window.onload = async () => {
  const chartConfig = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Temperature',
          data: [],
          borderColor: 'rgba(255, 0, 0, 1)',
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          yAxisID: 'y'
        },
        {
          label: 'CO₂',
          data: [],
          borderColor: 'rgba(0, 0, 255, 1)',
          backgroundColor: 'rgba(0, 0, 255, 0.5)',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      type: 'line',
      pointStyle: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second',
            unitStepSize: 1,
            displayFormats: {
              second: 'MMM DD hh:mm:ss, YYYY'
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',

          grid: {
            drawOnChartArea: false
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right'
        }
      }
    }
  };

  chart = new window.Chart(document.getElementById('chart'), chartConfig);
  await updateChart();

  // Update when document becomes visible.
  document.onvisibilitychange = updateChart;

  // Register for messages to update chart upon new data readings.
  chrome.runtime.connect().onMessage.addListener((msg) => {
    if (msg === REFRESH_CHART) {
      updateChart();
    } else if (msg === CO2_METER_AVAILABLE) {
      updateCO2MeterStatus(true);
    } else if (msg === CO2_METER_UNAVAILABLE) {
      updateCO2MeterStatus(false);
    }
  });

  // Dialog
  document.getElementById('closeDialogButton').onclick = () => {
    document.getElementById('noDeviceDialog').close();
  };

  await CO2Meter.init(CO2MeterConnected, CO2MeterDisconnected);
  const deviceStatus = await CO2Meter.getDeviceStatus();
  updateCO2MeterStatus(deviceStatus);
};

function updateCO2MeterStatus(connected) {
  let noDeviceDialog = document.getElementById('noDeviceDialog');
  if (connected) {
    noDeviceDialog.close();
  } else {
    if (!noDeviceDialog.open) {
      noDeviceDialog.showModal();
    }
  }
}

function CO2MeterConnected() {
  updateCO2MeterStatus(true);
}

function CO2MeterDisconnected() {
  updateCO2MeterStatus(false);
}

async function updateChart() {
  if (document.visibilityState == 'hidden') return; // Don't update if hidden.

  let TempData = await storage.getTempValueInRange(lastChartUpdateTimeMs);
  let CO2Data = await storage.getCO2ValueInRange(lastChartUpdateTimeMs);
  lastChartUpdateTimeMs = new Date().getTime();

  function KelvinToFahrenheit(k) {
    return ((k - 273.15) * 9) / 5 + 32;
  }
  function KelvinToCelsius(k) {
    return k - 273.15;
  }
  let isCelsius = (await storage.getTemperatureUnit()) == CELSIUS;
  let convert = isCelsius ? KelvinToCelsius : KelvinToFahrenheit;
  chart.data.datasets[0].label = 'Temperature ' + (isCelsius ? '(C)' : '(F)');

  TempData.forEach((datum) => {
    chart.data.datasets[0].data.push({
      x: datum.time,
      y: convert(datum.reading)
    });
  });
  CO2Data.forEach((datum) => {
    chart.data.datasets[1].data.push({ x: datum.time, y: datum.reading });
  });
  chart.update();
}
