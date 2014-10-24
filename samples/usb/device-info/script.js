var device_selector = document.getElementById('device-selector');
var add_device = document.getElementById('add-device');
var device_info = document.getElementById('device-info');

var devices = {};

function appendToDeviceSelector(device) {
  var el = document.createElement('option');
  el.setAttribute('value', device.device);
  el.textContent =
      'Product 0x' + ('0000' + device.productId.toString(16)).slice(-4) +
      ' Vendor 0x' + ('0000' + device.vendorId.toString(16)).slice(-4);
  device_selector.add(el);
};

function appendDeviceInfo(name, value) {
  el = document.createElement('b');
  el.textContent = name + ': '
  device_info.appendChild(el);
  device_info.appendChild(document.createTextNode(value));
  device_info.appendChild(document.createElement('br'));
}

function deviceSelectionChanged() {
  while (device_info.firstChild) {
    device_info.removeChild(device_info.firstChild);
  }

  var index = device_selector.selectedIndex;
  if (index == -1) {
    var el = document.createElement('em');
    el.textContent = 'No device selected.';
    device_info.appendChild(el);
  } else {
    var device = devices[device_selector.options.item(index).value];

    appendDeviceInfo(
        'Product ID',
        '0x' + ('0000' + device.productId.toString(16)).slice(-4));
    appendDeviceInfo(
        'Vendor ID',
        '0x' + ('0000' + device.vendorId.toString(16)).slice(-4));

    chrome.usb.openDevice(device, function(handle) {
      if (chrome.runtime.lastError != undefined) {
        var el = document.createElement('em');
        el.textContent = 'Failed to open device: ' +
            chrome.runtime.lastError.message;
        device_info.appendChild(el);
        return;
      }

      chrome.usb.getConfiguration(handle, function(config) {
        if (chrome.runtime.lastError != undefined) {
          var el = document.createElement('em');
          el.textContent = 'Failed to read device configuration: ' +
              chrome.runtime.lastError.message;
          device_info.appendChild(el);
          chrome.usb.closeDevice(handle);
          return;
        }

        var el = document.createElement('h2');
        el.textContent = 'Configuration ' + config.configurationValue;
        device_info.appendChild(el);

        for (var iface of config.interfaces) {
          el = document.createElement('h3');
          el.textContent = 'Interface ' + iface.interfaceNumber;
          device_info.appendChild(el);

          appendDeviceInfo('Alternate Setting', iface.alternateSetting);
          appendDeviceInfo('Inteface Class', iface.interfaceClass);
          appendDeviceInfo('Interface Subclass', iface.interfaceSubclass);
          appendDeviceInfo('Interface Protocol', iface.interfaceProtocol);

          for (var endpoint of iface.endpoints) {
            el = document.createElement('h4');
            el.textContent = 'Endpoint ' + endpoint.address;
            device_info.appendChild(el);

            appendDeviceInfo('Type', endpoint.type);
            appendDeviceInfo('Direction', endpoint.direction);
            appendDeviceInfo('Maximum Packet Size', endpoint.maximumPacketSize);
          }
        }

        chrome.usb.closeDevice(handle);
      })
    });
  }
}

chrome.usb.getDevices({}, function(found_devices) {
  if (chrome.runtime.lastError != undefined) {
    console.warn('chrome.usb.getDevices error: ' +
                 chrome.runtime.lastError.message);
    return;
  }

  for (var device of found_devices) {
    devices[device.device] = device;
    appendToDeviceSelector(device);
  }
});

add_device.addEventListener('click', function() {
  chrome.usb.getUserSelectedDevices({
    'multiple': false
  }, function(selected_devices) {
    if (chrome.runtime.lastError != undefined) {
      console.warn('chrome.usb.getUserSelectedDevices error: ' +
                   chrome.runtime.lastError.message);
      return;
    }

    for (var device of selected_devices) {
      if (device.deviceId in devices) {
        continue;
      }

      devices[device.device] = device;
      appendToDeviceSelector(device);
      device_selector.selectedIndex = device_selector.options.length - 1;
      deviceSelectionChanged();
    }
  });
});

device_selector.addEventListener('input', deviceSelectionChanged);
