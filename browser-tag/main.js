onload = function() {

  var iframe = document.createElement('iframe');
  iframe.className = 'sandboxed';
  iframe.sandbox = 'allow-scripts';
  iframe.src = chrome.extension.getURL('iframe.html');

  document.body.appendChild(iframe);
}
