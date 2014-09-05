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

var jwts = {
  'sandbox':
    'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIxNDIwNDk' +
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
  'prod': ''};

document.getElementById('jwt').value = jwts['sandbox'];
var currentEnv = 'sandbox';

function onEnvChanged(e) {
  currentEnv = e.target.value;
  document.getElementById('jwt').value = jwts[currentEnv];
}

var envs = document.getElementsByName('env');
for (var e = 0; e < envs.length; ++e) {
  envs[e].addEventListener('click', onEnvChanged);
}

document.getElementById('buyJwt').addEventListener('click', function() {
  google.payments.inapp.buy({
    parameters: {env: currentEnv},
    jwt: document.querySelector('#jwt').value,
    success: logSuccess,
    failure: logFailure
  });
});

