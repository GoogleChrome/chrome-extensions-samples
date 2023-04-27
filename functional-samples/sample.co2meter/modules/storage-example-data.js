const exampleData = [
  {
    temp: 299.375,
    CO2: 653
  },
  {
    temp: 299.3125,
    CO2: 653
  },
  {
    temp: 299.3125,
    CO2: 654
  },
  {
    temp: 299.3125,
    CO2: 665
  },
  {
    temp: 299.3125,
    CO2: 665
  },
  {
    temp: 299.1875,
    CO2: 629
  },
  {
    temp: 299.1875,
    CO2: 629
  },
  {
    temp: 299.1875,
    CO2: 629
  },
  {
    temp: 299.1875,
    CO2: 629
  },
  {
    temp: 299.1875,
    CO2: 628
  },
  {
    temp: 299.1875,
    CO2: 628
  },
  {
    temp: 299.1875,
    CO2: 627
  },
  {
    temp: 299.1875,
    CO2: 627
  },
  {
    temp: 299.125,
    CO2: 624
  },
  {
    temp: 299.125,
    CO2: 624
  },
  {
    temp: 299.125,
    CO2: 623
  },
  {
    temp: 299.125,
    CO2: 623
  },
  {
    temp: 299.125,
    CO2: 620
  },
  {
    temp: 299.125,
    CO2: 620
  },
  {
    temp: 299.125,
    CO2: 619
  }
];

let tempData = [];
let CO2Data = [];

const today = new Date();
const hourAgo = new Date(today.getTime() - 60 * 60 * 1000);
const step = hourAgo / exampleData.length;

for (let i = 0; i < exampleData.length; i++) {
  let time = hourAgo.getTime() + step * i;
  tempData.push({ time: time, reading: exampleData[i]['temp'] });
  CO2Data.push({ time: time, reading: exampleData[i]['temp'] });
}

export const ExampleTempData = tempData;
export const ExampleCO2Data = CO2Data;
