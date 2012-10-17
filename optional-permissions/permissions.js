function log(message) {
  document.querySelector('#log').textContent += message + '\n';
}

document.querySelector('#list-ports').onclick = function() {
  try {
    chrome.serial.getPorts(function(ports) {
      if (chrome.runtime.lastError) {
        log('Error when listing ports: ' + chrome.runtime.lastError.message);
        return;
      }
      log('Serial ports: ');
      ports.forEach(function(port) {
        log('  ' + port);
      });
    });
  } catch (ex) {
    log('Exception when listing ports: ' + ex);
  }
};

document.querySelector('#request-permission').onclick = function() {
  chrome.permissions.request({permissions: ['serial']}, function(result) {
    if (result) {
      log('App was granted the "serial" permission.');
    } else {
      log('App was not granted the "serial" permission.');
    }
  });
};

document.querySelector('#check-permission').onclick = function() {
  chrome.permissions.contains({permissions: ['serial']}, function(result) {
    if (result) {
      log('App has the "serial" permission.');
    } else {
      log('App does not have the "serial" permission.');
    }
  });
};
