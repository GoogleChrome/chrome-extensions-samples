onload = function() {
  document.getElementById('eval-button').onclick = runEval;
}

function runEval() {
  var inputNode = document.getElementById('input');
  var resultNode = document.getElementById('result');

  var messageHandler = function(event) {
    // TODO(mihaip): validate event.origin
    resultNode.textContent = event.data;
    window.removeEventListener('message', messageHandler);
    document.body.removeChild(iframe);
  }
  window.addEventListener('message', messageHandler);

  var iframe = document.createElement('iframe');
  iframe.onload = function() {
    iframe.contentWindow.postMessage(inputNode.value, '*');
  };
  iframe.src = 'iframe.html';
  document.body.appendChild(iframe);
}
