window.addEventListener('load', function(e) {
  var webview = document.querySelector('#untrusted');
  webview.addEventListener('loadstop', function(e) {
    webview.terminate();
  });
});
