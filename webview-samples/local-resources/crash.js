window.addEventListener('load', function(e) {
  var crashButton = document.querySelector('#simulate-crash');
  var reloadButton = document.querySelector('#reload');
  var webview = document.querySelector('#untrusted');
  crashButton.addEventListener('click', function(e) {
    webview.terminate();
  });
  reloadButton.addEventListener('click', function(e) {
    webview.reload();
  });
});
