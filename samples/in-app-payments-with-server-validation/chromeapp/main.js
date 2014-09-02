function log(msg) {
  console.log(msg);
  var e = document.getElementById('log');
  e.innerHTML = msg + '<br>';
}

function logSuccess(result) {
  log('Success. Response from server: ' + JSON.stringify(result));
  var img = document.getElementById('imgYay');
  var btnVerify = document.getElementById('btnVerify');
  if ((result.request.name == "Sad Panda") ||
      (result.request.name == "Many Sad Pandas")) {
    img.src = "sadpanda.png";
  } else if (result.request.name == "HTML5 Hipster") {
    img.src = "html5hipster-small.png";
  }
  img.setAttribute("data-orderId", result.response.orderId);
  btnVerify.style.display = "inline-block";
}

function logFailure(result) {
  log('Failed. Response from server: ' + JSON.stringify(result));
}

function verifyPurchase(orderId) {
  log('Verify Order ID: ' + orderId);
  var btnVerify = document.getElementById('btnVerify');
  btnVerify.setAttribute("disabled", "disabled");
  $.ajax({
    url: "http://iapcb-demo.appspot.com/verify",
    method: "GET",
    data: {"orderId": orderId}
  }).done(function(data) {
    log('Purchase verification: ' + JSON.stringify(data));
    if (data.success === true) {
      btnVerify.innerText = "Purchase verified.";
    }
  });
}

function resetPurchase() {
  var btnVerify = document.getElementById('btnVerify');
  btnVerify.removeAttribute("disabled");
  btnVerify.innerText = "Verify Purchase";
  btnVerify.style.display = "none";
  var img = document.getElementById('imgYay');
  img.src = "500x350.gif";
  img.removeAttribute("data-orderId");
  log('');
}

document.getElementById('btnSinglePanda').addEventListener('click', function() {
  resetPurchase();
  google.payments.inapp.buy({
    parameters: {},
    jwt: 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJhdWQiOiAiR29vZ2xlIiwgI' +
         'mlzcyI6ICIwMDczODA1MzgwMDIxNDk3MjYwNyIsICJyZXF1ZXN0IjogeyJjdXJyZW5' +
         'jeUNvZGUiOiAiVVNEIiwgInByaWNlIjogIjEuOTkiLCAic2VsbGVyRGF0YSI6ICJJI' +
         'Gxpa2UgdHJhZmZpYyBsaWdodHMiLCAibmFtZSI6ICJTYWQgUGFuZGEiLCAiZGVzY3J' +
         'pcHRpb24iOiAiQSBzYWQgcGFuZGEgY3J5aW5nIn0sICJleHAiOiAxNDAzNzE0ODEwL' +
         'CAiaWF0IjogMTM3MjE3ODgxMCwgInR5cCI6ICJnb29nbGUvcGF5bWVudHMvaW5hcHA' +
         'vaXRlbS92MSJ9.SUXu7lOo3NzqmAf-cz7mAlupZ2EmCf8Zqwv2LUFc3Qg',
    success: logSuccess,
    failure: logFailure
  });
});

document.getElementById('btnSingleHipster').addEventListener('click', function() {
  resetPurchase();
  google.payments.inapp.buy({
    parameters: {},
    jwt: 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJhdWQiOiAiR29vZ2xlIiwgI' +
         'mlzcyI6ICIwMDczODA1MzgwMDIxNDk3MjYwNyIsICJyZXF1ZXN0IjogeyJjdXJyZW5' +
         'jeUNvZGUiOiAiVVNEIiwgInByaWNlIjogIjEzLjM3IiwgInNlbGxlckRhdGEiOiAiU' +
         'HVnIExpZmUiLCAibmFtZSI6ICJIVE1MNSBIaXBzdGVyIiwgImRlc2NyaXB0aW9uIjo' +
         'gIlRoZSBvcmlnaW5hbCBIVE1MNSBIaXBzdGVyIn0sICJleHAiOiAxNDAzNzE0OTY0L' +
         'CAiaWF0IjogMTM3MjE3ODk2NCwgInR5cCI6ICJnb29nbGUvcGF5bWVudHMvaW5hcHA' +
         'vaXRlbS92MSJ9.D6YII1rbgMMAAmvgcBUxN2Lkl7VJaukrZS_hKMSIpiM',
    success: logSuccess,
    failure: logFailure
  });
});

document.getElementById('btnSubscription').addEventListener('click', function() {
  resetPurchase();
  google.payments.inapp.buy({
    parameters: {},
    jwt: 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJhdWQiOiAiR29vZ2xlIiwgI' +
         'mlzcyI6ICIwMDczODA1MzgwMDIxNDk3MjYwNyIsICJyZXF1ZXN0IjogeyJpbml0aWF' +
         'sUGF5bWVudCI6IHsicGF5bWVudFR5cGUiOiAicHJvcmF0ZWQiLCAicHJpY2UiOiAiO' +
         'S45OSIsICJjdXJyZW5jeUNvZGUiOiAiVVNEIn0sICJyZWN1cnJlbmNlIjogeyJwcml' +
         'jZSI6ICIxLjQ5IiwgImZyZXF1ZW5jeSI6ICJtb250aGx5IiwgImN1cnJlbmN5Q29kZ' +
         'SI6ICJVU0QiLCAic3RhcnRUaW1lIjogMTM3NDc3OTk2M30sICJzZWxsZXJEYXRhIjo' +
         'gIkFFSU9VIGFuZCBzb21ldGltZXMgWSIsICJuYW1lIjogIk1hbnkgU2FkIFBhbmRhc' +
         'yIsICJkZXNjcmlwdGlvbiI6ICJBIG5ldywgc2FkZGVyIHBhbmRhIGV2ZXJ5IG1vbnR' +
         'oIn0sICJleHAiOiAxNDAzNzE1OTYzLCAiaWF0IjogMTM3MjE3OTk2MywgInR5cCI6I' +
         'CJnb29nbGUvcGF5bWVudHMvaW5hcHAvc3Vic2NyaXB0aW9uL3YxIn0.o-2WntIOBtg' +
         'ALTFXqPWdGhaV1RHxfUtdb2-fTiewCss',
    success: logSuccess,
    failure: logFailure
  });
});

document.getElementById('btnVerify').addEventListener('click', function() {
  var img = document.getElementById('imgYay');
  verifyPurchase(img.getAttribute("data-orderId"));
});




