import storage from "./modules/storage.js";
import { NEW_READING_SAVED_MESSAGE } from "./modules/constant.js";

let lastChartUpdateTimeMs = 
  new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).getTime();  // Initialize to one week ago.

let chart = null;

window.onload = async e => {
  const chartConfig = {
    type: 'line',
    data: {
      datasets: [
        {
          label: "Temperature (F)",
          data: [],
          borderColor: 'rgba(255, 0, 0, 1)',
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          yAxisID: 'y'
        },
        {
          label: "CO₂",
          data: [],
          borderColor: 'rgba(0, 0, 255, 1)',
          backgroundColor: 'rgba(0, 0, 255, 0.5)',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'timeseries'
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

  chart = new Chart(document.getElementById('chart'), chartConfig);
  await updateChart();
  
  // Update when document becomes visible.
  document.onvisibilitychange = updateChart;

  // Register for messages to update chart upon new data readings.
  chrome.runtime.connect().onMessage.addListener((msg) => {
    if (msg === NEW_READING_SAVED_MESSAGE) { updateChart() }
  });
}

async function updateChart() {
  if (document.visibilityState == 'hidden')
    return;  // Don't update if hidden.

  let TempData = await storage.getTempValueInRange(lastChartUpdateTimeMs);
  let CO2Data = await storage.getCO2ValueInRange(lastChartUpdateTimeMs);
  lastChartUpdateTimeMs = new Date().getTime();

  function KelvinToFahrenheit(k) { return (k - 273.15) * 9/5 + 32; }
  TempData.forEach(datum => {
    chart.data.datasets[0].data.push({ x: datum.time, y: KelvinToFahrenheit(datum.reading) });
  });
  CO2Data.forEach(datum => {
    chart.data.datasets[1].data.push({ x: datum.time, y: datum.reading });
  });
  chart.update();
}    
