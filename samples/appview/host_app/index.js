var container = document.querySelector('#container');
var logField = document.querySelector('#log');
var form = document.querySelector('form');
var embedAppId = document.querySelector('#embedAppId');
var embedAppData = document.querySelector('#embedAppData');

form.addEventListener('submit', function(event) {
  event.preventDefault();

  var appview = document.createElement('appview');
  container.textContent = '';
  container.appendChild(appview);

  try {
    var data = JSON.parse(embedAppData.value || '{}');
  } catch(e) {
    appendLog('&#9888; Syntax error has occured when parsing JSON App Data.');
    return;
  }

  appendLog('Attempting to embed app ' + embedAppId.value + '...');
  appview.connect(embedAppId.value, data, function(result) {
    if (result) {
      appendLog('Embedding request has succedded.');
    } else {
      appendLog('Embedding request has failed.');
    }
    appview.classList.toggle('success', result);
  });
  
});

function appendLog(message) {
  logField.innerHTML += new Date().toLocaleTimeString() + ': ' + message + '<br/>';
  logField.scrollTop = logField.scrollHeight;
}
