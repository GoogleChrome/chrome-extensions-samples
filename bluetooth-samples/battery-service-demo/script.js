// GATT Battery Service UUIDs
var BATTERY_SERVICE_UUID    = '0000180f-0000-1000-8000-00805f9b34fb';
var BATTERY_LEVEL_CHRC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

// The currently displayed service and characteristics.
var batteryService;
var batteryLevelCharacteristic;

// A mapping from device addresses to device names for found devices that expose
// a Battery service.
var batteryDevicesMap = {};

/**
 * Updates the UI based on the selected service.
 * @param {chrome.bluetoothLowEnergy.Service} service The selected GATT service
 *     to display.
 */
function selectService(service) {
  // Hide or show the appropriate elements based on whether or not
  // |serviceId| is undefined.
  UI.getInstance().resetState(!service);

  batteryService = service;

  // Disable notifications from the currently selected Battery Level
  // characteristic.
  if (batteryLevelCharacteristic) {
    chrome.bluetoothLowEnergy.stopCharacteristicNotifications(
        batteryLevelCharacteristic.instanceId);
  }

  batteryLevelCharacteristic = undefined;
  updateBatteryLevelValue();  // Initialize to unknown

  if (!service) {
    console.log('No service selected.');
    return;
  }

  console.log('GATT service selected: ' + service.instanceId);

  // Get the characteristics of the selected service.
  chrome.bluetoothLowEnergy.getCharacteristics(service.instanceId,
                                               function (chrcs) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
      return;
    }

    // Make sure that the same service is still selected.
    if (batteryService && service.instanceId != batteryService.instanceId) {
      return;
    }

    if (chrcs.length == 0) {
      console.log('Service has no characteristics: ' + service.instanceId);
      return;
    }

    chrcs.forEach(function (chrc) {
      // This service should have only one characteristic.
      if (chrc.uuid != BATTERY_LEVEL_CHRC_UUID) {
        console.log('Found unexpected characteristic: ' + chrc.instanceId +
                    ' with UUID: ' + chrc.uuid);
        return;
      }

      console.log('Setting Battery Level characteristic: ' + chrc.instanceId);
      batteryLevelCharacteristic = chrc;

      // Enable notifications from the characteristic.
      chrome.bluetoothLowEnergy.startCharacteristicNotifications(
          chrc.instanceId,
          function () {
        if (chrome.runtime.lastError &&
            chrome.runtime.lastError.message != 'Already notifying') {
          console.log('Failed to enable Battery Level notifications: ' +
                      chrome.runtime.lastError.message);
          return;
        }

        console.log('Battery Level notifications enabled! Sending request to ' +
                    'read current battery level.');

        // Read the value of the characteristic once and store it. The Battery
        // Level characteristic must support both reads and notifications, so
        // we will track the value via both.
        chrome.bluetoothLowEnergy.readCharacteristicValue(chrc.instanceId,
                                                          function (readChrc) {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
          }

          // Make sure that the same characteristic is still selected.
          if (readChrc.instanceId != batteryLevelCharacteristic.instanceId) {
            return;
          }

          // No need the update the value here, as a successful read will trigger
          // the onCharacteristicValueChanged event. We will perform the update in
          // the listener instead.
          console.log('Request to read battery level complete.');
        });
      });
    });
  });
}

/**
 * Updates the Battery Level field based on the value of the currently selected
 * Battery Level characteristic.
 */
function updateBatteryLevelValue() {
  if (!batteryLevelCharacteristic) {
    console.log('No Battery Level Characteristic selected');
    UI.getInstance().setBatteryLevel(null);
    return;
  }

  // Value field might be undefined  if the read request failed or no
  // notification has been received yet.
  if (!batteryLevelCharacteristic.value) {
    console.log('No Battery Level value received yet');
    return;
  }

  var valueBytes = new Uint8Array(batteryLevelCharacteristic.value);

  // The value should contain a single byte.
  if (valueBytes.length != 1) {
    console.log('Invalid Battery Level value length: ' + valueBytes.length);
    return;
  }

  var batteryLevel = valueBytes[0];
  UI.getInstance().setBatteryLevel(batteryLevel);
}

/**
 * This is the entry point of the application. Initialize UI state and set up
 * the relevant Bluetooth Low Energy event listeners.
 */
function main() {
  // Set up the UI to look like no device was initially selected.
  selectService(undefined);

  // Request information about the local Bluetooth adapter to be displayed in
  // the UI.
  var updateAdapterState = function (adapterState) {
      UI.getInstance().setAdapterState(adapterState.address, adapterState.name);
  };

  chrome.bluetooth.getAdapterState(function (adapterState) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    }

    updateAdapterState(adapterState);
  });

  chrome.bluetooth.onAdapterStateChanged.addListener(updateAdapterState);

  // Initialize |batteryDevicesMap|.
  chrome.bluetooth.getDevices(function (devices) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    }

    if (devices) {
      devices.forEach(function (device) {
        // See if the device exposes a Battery service.
        chrome.bluetoothLowEnergy.getServices(device.address,
                                              function (services) {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
          }

          if (!services) {
            return;
          }

          var found = false;
          services.forEach(function (service) {
            if (service.uuid == BATTERY_SERVICE_UUID) {
              console.log('Found Battery service!');
              found = true;
            }
          });

          if (!found) {
            return;
          }

          console.log('Found device with Battery service: ' +
                      device.address);
          batteryDevicesMap[device.address] =
              (device.name ? device.name : device.address);

          UI.getInstance().updateDeviceSelector(batteryDevicesMap);
        });
      });
    }
  });

  // Set up the device selector.
  UI.getInstance().setDeviceSelectionHandler(function(selectedValue) {
    // If |selectedValue| is empty, unselect everything.
    if (!selectedValue) {
      selectService(undefined);
      return;
    }

    // Request all GATT services of the selected device to see if it still has
    // a Battery service and pick the first one to display.
    chrome.bluetoothLowEnergy.getServices(selectedValue, function (services) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        selectService(undefined);
        return;
      }

      var foundService = undefined;
      for (var i = 0; i < services.length; i++) {
        if (services[i].uuid == BATTERY_SERVICE_UUID) {
          foundService = services[i];
          break;
        }
      }

      selectService(foundService);
    });
  });

  // Track GATT services as they are added.
  chrome.bluetoothLowEnergy.onServiceAdded.addListener(function (service) {
    // Ignore, if the service is not a Battery service.
    if (service.uuid != BATTERY_SERVICE_UUID) {
      return;
    }

    // Add the device of the service to the device map and update the UI.
    console.log('New Battery service added: ' + service.instanceId);
    if (batteryDevicesMap.hasOwnProperty(service.deviceAddress)) {
      return;
    }

    // Looks like it's a brand new device. Get information about the device so
    // that we can display the device name in the drop-down menu.
    chrome.bluetooth.getDevice(service.deviceAddress, function (device) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      batteryDevicesMap[device.address] =
          (device.name ? device.name : device.address);
      UI.getInstance().updateDeviceSelector(batteryDevicesMap);
    });
  });

  // Track GATT services as they are removed.
  chrome.bluetoothLowEnergy.onServiceRemoved.addListener(function (service) {
    // Ignore, if the service is not a Battery service.
    if (service.uuid != BATTERY_SERVICE_UUID) {
      return;
    }

    // See if this is the currently selected service. If so, unselect it.
    console.log('Battery service removed: ' + service.instanceId);
    var selectedRemoved = false;
    if (batteryService && batteryService.instanceId == service.instanceId) {
      console.log('The selected service disappeared!');
      selectService(undefined);
      selectedRemoved = true;
    }

    // Remove the associated device from the map only if it has no other Battery
    // services exposed (this will usually be the case)
    if (!batteryDevicesMap.hasOwnProperty(service.deviceAddress)) {
      return;
    }

    chrome.bluetooth.getDevice(service.deviceAddress, function (device) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      chrome.bluetoothLowEnergy.getServices(device.address,
                                            function (services) {
        if (chrome.runtime.lastError) {
          // Error obtaining services. Remove the device from the map.
          console.log(chrome.runtime.lastError.message);
          delete batteryDevicesMap[device.address];
          UI.getInstance().updateDeviceSelector(batteryDevicesMap,
                                                true /* reset */);
          return;
        }

        var found = false;
        for (var i = 0; i < services.length; i++) {
          if (services[i].uuid == BATTERY_SERVICE_UUID) {
            found = true;
            break;
          }
        }

        if (found) {
          return;
        }

        console.log('Removing device: ' + device.address);
        delete batteryDevicesMap[device.address];
        UI.getInstance().updateDeviceSelector(batteryDevicesMap);

        if (selectedRemoved) {
          UI.getInstance().triggerDeviceSelection();
        }
      });
    });
  });

  // Track GATT services as they change.
  chrome.bluetoothLowEnergy.onServiceChanged.addListener(function (service) {
    // This only matters if the selected service changed.
    if (!batteryService || service.instanceId != batteryService.instanceId) {
      return;
    }

    console.log('The selected service has changed');

    // Reselect the service to force an updated.
    selectService(service);
  });

  // Track GATT characteristic value changes. This event will be triggered after
  // successful characteristic value reads and received notifications and
  // indications.
  chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(
      function (chrc) {
    if (batteryLevelCharacteristic &&
        chrc.instanceId == batteryLevelCharacteristic.instanceId) {
      console.log('Battery Level value changed');
      batteryLevelCharacteristic = chrc;
      updateBatteryLevelValue();
      return;
    }
  });
}

document.addEventListener('DOMContentLoaded', main);
