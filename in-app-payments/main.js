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
    jwt: 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9' +
         '.eyJhdWQiOiAiR29vZ2xlIiwgImlzcyI6ICIwMjA' +
         '1NTA5MDM4OTY2NTMxMzk3MSIsICJyZXF1ZXN0Ijo' +
         'geyJwcmljZSI6ICIxLjk5IiwgImN1cnJlbmN5Q29' +
         'kZSI6ICJVU0QiLCAic2VsbGVyRGF0YSI6ICJfc2V' +
         'sbGVyX2RhdGFfIiwgIm5hbWUiOiAiU2FmZXR5bW9' +
         '1c2UgUGF0Y2giLCAiZGVzY3JpcHRpb24iOiAiVGh' +
         'lIHNhZmV0aWVzdCB3YXkgdG8gZGlzcGxheSB5b3V' +
         'yIGZsYWlyIn0sICJleHAiOiAyNDY1NjMyODU2LCA' +
         'iaWF0IjogMTM2NTYzMjg3NSwgInR5cCI6ICJnb29' +
         'nbGUvcGF5bWVudHMvaW5hcHAvaXRlbS92MSJ9.nG' +
         'U9n_DtjFTrTVWo20LcxVHhqh29fRh-BjICC9Vjma' +
         '8',
    success: logSuccess,
    failure: logFailure
  });
});

