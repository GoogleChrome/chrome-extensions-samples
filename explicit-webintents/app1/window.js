function log(message) {
  document.getElementById('log').textContent = message;
}

function handleIntent(intent) {
  log('Received intent: ' + JSON.stringify(intent));
}

function dispatchIntent() {
  var intent = new WebKitIntent({
    action: 'chrome-extension://app2/op',
    type: 'text/plain',
    data: 'intent data!',
    // For packaged apps, the service URL is their background page URL (see
    // http://code.google.com/searchframe#OAMlx_jo-ck/src/chrome/common/extensions/extension.cc&exact_package=chromium&q=kkey%20file:Extension&type=cs&l=1978)
    service: 'chrome-extension://bhjkdniooihlaafoddlgkljnjlgoolmo/_generated_background_page.html'
  });

  window.navigator.webkitStartActivity(
    intent,
    function(result) {
      log('Got intent reply result: ' + JSON.stringify(result));
    },
    function(error) {
      log('Got intent reply error: ' + JSON.stringify(error));
    });
}

onload = function() {
  document.getElementById('dispatch-intent').onclick = dispatchIntent;
  if (launchData) {
    if (launchData.intent) {
      handleIntent(launchData.intent);
    }
    delete launchData;
  }
}