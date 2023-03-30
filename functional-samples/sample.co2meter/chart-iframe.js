import storage from "./modules/storage.js";

let lastChartUpdateTimeMs = 
  new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).getTime();  // Initialize to one week ago.

chrome.runtime.onMessage.addListener(
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      console.log('popup.js:', request, sender);
      if (request.msg == 'new reading saved') {
        // TODO: refresh the chart with new data in the storage.
        console.log('to refresh the chart');
        storage.getCO2ValueInRange(1680151566926).then((e) => console.log('CO2:', e));
        storage.getTempValueInRange(1680151566926).then((e) => console.log('Temp', e));
      }
    }
  ));

window.onload = async e => {
  const chartConfig = {
    type: 'line',
    data: {
      datasets: [
        {
          label: "Temperature",
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
  const chart = new Chart(document.getElementById('chart'), chartConfig);

  /*
  let CO2Temp = await Promise.all(
    [storage.getCO2ValueInRange(lastChartUpdateTimeMs),
    storage.getTempValueInRange(lastChartUpdateTimeMs)]);*/
  
  let TempData = await storage.getTempValueInRange(lastChartUpdateTimeMs);
  let CO2Data = await storage.getCO2ValueInRange(lastChartUpdateTimeMs);
  lastChartUpdateTimeMs = new Date().getTime();
  TempData.forEach(datum => {
    chart.data.datasets[0].data.push({ x: datum.time, y: datum.reading });
  });
  CO2Data.forEach(datum => {
    chart.data.datasets[1].data.push({ x: datum.time, y: datum.reading });
  });
  chart.update();
}    