function log(message) {
  document.getElementById('log').textContent +=
      '[' + new Date().toLocaleTimeString() + '] ' + message + '\n';
}

function handleIntent(intent) {
  log('Received intent: ' + JSON.stringify(intent.data));
  intent.postResult('PING');
  log('Replied to intent');
}

function dispatchIntent() {
  var intent = new WebKitIntent({
    action: 'chrome-extension://app2/op',
    type: 'text/plain',
    data: 'PING',
    // For packaged apps, the service URL is their background page URL (see
    // http://code.google.com/searchframe#OAMlx_jo-ck/src/chrome/common/extensions/extension.cc&exact_package=chromium&q=kkey%20file:Extension&type=cs&l=1978)
    service: 'chrome-extension://bhjkdniooihlaafoddlgkljnjlgoolmo/_generated_background_page.html'
  });

  log('Sending intent');
  window.navigator.webkitStartActivity(
    intent,
    function(result) {
      log('Intent result: ' + JSON.stringify(result));
    },
    function(error) {
      log('Intent error: ' + JSON.stringify(error));
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