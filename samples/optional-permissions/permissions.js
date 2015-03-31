function log(message) {
  document.querySelector('#log').textContent += message + '\n';
}

document.querySelector('#list-devices').onclick = function() {
  try {
    chrome.serial.getDevices(function(devices) {
      if (chrome.runtime.lastError) {
        log('Error when listing devices: ' + chrome.runtime.lastError.message);
        return;
      }
      log('Serial devices: ');
      devices.forEach(function(device) {
        log('  ' + device.path);
      });
    });
  } catch (ex) {
    log('Exception when listing devices: ' + ex);
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
