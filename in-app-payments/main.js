function log(msg) {
  console.log(msg);
  var e = document.getElementById('log');
  e.innerHTML = e.innerHTML + msg + '<br>';
}

function logSuccess(result) {
  log('Success: ' + JSON.stringify(result));
}

function logFailure(result) {
  log('Failure: ' + JSON.stringify(result));
}

document.getElementById('buyBtn').addEventListener('click', function() {
  google.payments.inapp.buy({
    parameters: {},
    jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIxNDIwNDk' +
         '1MzA5NDM1MjE2ODU3MSIsImF1ZCI6Ikdvb2dsZSI' +
         'sInR5cCI6Imdvb2dsZS9wYXltZW50cy9pbmFwcC9' +
         'zdWJzY3JpcHRpb24vdjEiLCJpYXQiOjEzNTg0NTc' +
         'yNjksImV4cCI6MjM1ODQxMjMzNDMsInJlcXVlc3Q' +
         'iOnsiaW5pdGlhbFBheW1lbnQiOnsicHJpY2UiOiI' +
         'xMC41MCIsImN1cnJlbmN5Q29kZSI6IlVTRCIsInB' +
         'heW1lbnRUeXBlIjoicHJvcmF0ZWQifSwicmVjdXJ' +
         'yZW5jZSI6eyJwcmljZSI6IjQuOTkiLCJjdXJyZW5' +
         'jeUNvZGUiOiJVU0QiLCJzdGFydERhdGUiOiIxMzU' +
         '4NDYzMjY5IiwiZnJlcXVlbmN5IjoibW9udGhseSI' +
         'sIm51bVJlY3VycmVuY2VzIjoiMTIifSwibmFtZSI' +
         '6IlBpZWNlIG9mIENha2UiLCJkZXNjcmlwdGlvbiI' +
         '6IkEgZGVsaWNpb3VzIHBpZWNlIG9mIHZpcnR1YWw' +
         'gY2FrZSIsInNlbGxlckRhdGEiOiJZb3VyIERhdGE' +
         'gSGVyZSJ9fQ.sXd39R7MNNfDFa-jnlTNu2C2te-_' +
         'x9--87Phfdr5GrE',
    success: logSuccess,
    failure: logFailure
  });
});

document.getElementById('buyBtnProd').addEventListener('click', function() {
  google.payments.inapp.buy({
    parameters: {env: 'prod'},
    jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIwMjA1NTA' +
         '5MDM4OTY2NTMxMzk3MSIsImF1ZCI6Ikdvb2dsZSI' +
         'sImlhdCI6MTM3ODgzNzI2MiwiZXhwIjoyMzc4ODM' +
         '3MjYyLCJ0eXAiOiJnb29nbGUvcGF5bWVudHMvaW5' +
         'hcHAvaXRlbS92MSIsInJlcXVlc3QiOnsibmFtZSI' +
         '6IlZpcnR1YWwgQmFjb24iLCJkZXNjcmlwdGlvbiI' +
         '6Ikp1c3Qgc29tZSB2aXJ0dWFsIGJhY29uLiIsInB' +
         'yaWNlIjoiNS4wMCIsImN1cnJlbmN5Q29kZSI6IlV' +
         'TRCIsInNlbGxlckRhdGEiOiJfc2VsbGVyX2RhdGF' +
         'fIn19.utZ0Gop538zuXoE4bXAfctWabBWvjOxHVv' +
         '89nUp/YrY=',
    success: logSuccess,
    failure: logFailure
  });
});

