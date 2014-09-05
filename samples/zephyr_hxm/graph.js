var chart = new Highcharts.Chart({
    chart: {
        renderTo: 'container',
        type: 'line',
        marginRight: 130,
        marginBottom: 25
    },
    title: {
        text: 'Heart Rate',
        x: -20 //center
    },
    yAxis: {
        title: {
            text: 'Heart Rate (bpm)'
        },
        plotLines: [{
            value: 0,
            width: 1,
            color: '#808080'
        }]
    },
    xAxis: {
        labels: {
            enabled: false
        }
    },
    legend: {
        enabled: false
    },
    series: [{
        name: 'Heart Rate',
        data: []
    }]
});

window.addEventListener('message', function(e) {
    var s = chart.series[0];
    s.addPoint(e.data.heartrate, true, s.data.length > 20);
  }, false);
