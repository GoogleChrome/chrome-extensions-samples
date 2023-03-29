window.onload = async e => {
  const openTabButtonElement = document.createElement('button');
  openTabButtonElement.appendChild(document.createTextNode('Settings Page'));
  openTabButtonElement.onclick = e => { window.open('settings.html', '_blank'); };
  document.body.appendChild(openTabButtonElement);

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
  // TODO replace this test dummy data with real updates.
  chart.data.datasets[0].data.push({ x: new Date(1), y: 5 });
  chart.data.datasets[0].data.push({ x: new Date(2), y: 2 });
  chart.data.datasets[0].data.push({ x: new Date(3), y: 4 });
  chart.data.datasets[0].data.push({ x: new Date(4), y: 5 });
  chart.data.datasets[0].data.push({ x: new Date(5), y: 4 });
  chart.data.datasets[1].data.push({ x: new Date(2), y: 1 });
  chart.data.datasets[1].data.push({ x: new Date(4), y: 3 });
  chart.data.datasets[1].data.push({ x: new Date(5), y: 7 });
  chart.data.datasets[1].data.push({ x: new Date(6), y: 4 });
  chart.update();
};
