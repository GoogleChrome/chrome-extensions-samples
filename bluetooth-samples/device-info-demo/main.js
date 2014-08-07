// GATT Device Information Service UUIDs
var DEVICE_INFO_SERVICE_UUID           = '0000180a-0000-1000-8000-00805f9b34fb';
var MANUFACTURER_NAME_STRING_CHRC_UUID = '00002a29-0000-1000-8000-00805f9b34fb';
var SERIAL_NUMBER_STRING_CHRC_UUID     = '00002a25-0000-1000-8000-00805f9b34fb';
var HARDWARE_REVISION_STRING_CHRC_UUID = '00002a27-0000-1000-8000-00805f9b34fb';
var FIRMWARE_REVISION_STRING_CHRC_UUID = '00002a26-0000-1000-8000-00805f9b34fb';
var SOFTWARE_REVISION_STRING_CHRC_UUID = '00002a28-0000-1000-8000-00805f9b34fb';
var PNP_ID_CHRC_UUID                   = '00002a50-0000-1000-8000-00805f9b34fb';

// The currently displayed service and characteristics.
var deviceInfoService;
var characteristicMap = {};

// A mapping from device addresses to device names for found devices that expose
// a Device Information service.
var deviceInfoDevicesMap = {};

/**
 * Updates the UI based on the selected service.
 * @param {chrome.bluetoothLowEnergy.Service} service The selected GATT service
 *     to display.
 */
function selectService(service) {
  // Hide or show the appropriate elements based on whether or not
  // |serviceId| is undefined.
  UI.getInstance().resetState(!service);

  deviceInfoService = service;
  characteristicMap = {};

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
    if (service.instanceId != deviceInfoService.instanceId)
      return;

    if (chrcs.length == 0) {
      console.log('Service has no characteristics: ' + service.instanceId);
      return;
    }

    chrcs.forEach(function (chrc) {
      var fieldId;
      var valueDisplayFunction = UI.getInstance().setStringValue;

      if (chrc.uuid == MANUFACTURER_NAME_STRING_CHRC_UUID) {
        console.log('Setting Manufacturer Name String Characteristic: ' +
                    chrc.instanceId);
        fieldId = 'manufacturer-name-string';
      } else if (chrc.uuid == SERIAL_NUMBER_STRING_CHRC_UUID) {
        console.log('Setting Serial Number String Characteristic: ' +
                    chrc.instanceId);
        fieldId = 'serial-number-string';
      } else if (chrc.uuid == HARDWARE_REVISION_STRING_CHRC_UUID) {
        console.log('Setting Hardware Revision String Characteristic: ' +
                    chrc.instanceId);
        fieldId = 'hardware-revision-string';
      } else if (chrc.uuid == FIRMWARE_REVISION_STRING_CHRC_UUID) {
        console.log('Setting Firmware Revision String Characteristic: ' +
                    chrc.instanceId);
        fieldId = 'firmware-revision-string';
      } else if (chrc.uuid == SOFTWARE_REVISION_STRING_CHRC_UUID) {
        console.log('Setting Software Revision String Characteristic: ' +
                    chrc.instanceId);
        fieldId = 'software-revision-string';
      } else if (chrc.uuid == PNP_ID_CHRC_UUID) {
        console.log('Setting PnP ID Characteristic: ' + chrc.instanceId);
        fieldId = 'pnp-id';
        valueDisplayFunction = UI.getInstance().setPnpIdValue;
      }

      if (fieldId === undefined) {
        console.log('Ignoring characteristic "' + chrc.instanceId +
                    '" with UUID ' + chrc.uuid);
        return;
      }

      characteristicMap[fieldId] = chrc;

      // Read the value of the characteristic and store it.
      chrome.bluetoothLowEnergy.readCharacteristicValue(chrc.instanceId,
                                                        function (readChrc) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }

        // Make sure that the same characteristic is still selected.
        if (!characteristicMap.hasOwnProperty(fieldId) ||
            characteristicMap[fieldId].instanceId != readChrc.instanceId)
          return;

        characteristicMap[fieldId] = readChrc;
        valueDisplayFunction(fieldId, readChrc.value);
      });
    });
  });
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
  var updateAdapterState = function(adapterState) {
    UI.getInstance().setAdapterState(adapterState.address, adapterState.name);
  };

  chrome.bluetooth.getAdapterState(function (adapterState) {
    if (chrome.runtime.lastError)
      console.log(chrome.runtime.lastError.message);

    updateAdapterState(adapterState);
  });

  chrome.bluetooth.onAdapterStateChanged.addListener(updateAdapterState);

  var storeDevice = function(deviceAddress, device) {
    var resetUI = false;
    if (device == null) {
      delete deviceInfoDevicesMap[deviceAddress];
      resetUI = true;
    } else {
      deviceInfoDevicesMap[deviceAddress] =
          (device.name ? device.name : device.address);
    }

    // Update the selector UI with the new device list.
    UI.getInstance().updateDeviceSelector(deviceInfoDevicesMap, resetUI);
  };

  // Initialize |deviceInfoDevicesMap|.
  chrome.bluetooth.getDevices(function (devices) {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    }

    if (devices) {
      devices.forEach(function (device) {
        // See if the device exposes a Device Information service.
        chrome.bluetoothLowEnergy.getServices(device.address,
                                              function (services) {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
          }

          if (!services)
            return;

          var found = false;
          services.forEach(function (service) {
            if (service.uuid == DEVICE_INFO_SERVICE_UUID) {
              console.log('Found Device Information service!');
              found = true;
            }
          });

          if (!found)
            return;

          console.log('Found device with Device Information service: ' +
                      device.address);
          storeDevice(device.address, device);
        });
      });
    }
  });

  // Set up the device selector.
  var deviceSelector = document.getElementById('device-selector');
  deviceSelector.onchange = function () {
    var selectedValue = deviceSelector[deviceSelector.selectedIndex].value;

    // If |selectedValue| is empty, unselect everything.
    if (!selectedValue) {
      selectService(undefined);
      return;
    }

    // Request all GATT services of the selected device to see if it still has
    // a Device Information service and pick the first one to display.
    chrome.bluetoothLowEnergy.getServices(selectedValue, function (services) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        selectService(undefined);
        return;
      }

      var foundService = undefined;
      services.forEach(function (service) {
        if (service.uuid == DEVICE_INFO_SERVICE_UUID)
          foundService = service;
      });

      selectService(foundService);
    });
  };

  // Track GATT services as they are added.
  chrome.bluetoothLowEnergy.onServiceAdded.addListener(function (service) {
    // Ignore, if the service is not a Device Information service.
    if (service.uuid != DEVICE_INFO_SERVICE_UUID)
      return;

    // Add the device of the service to the device map and update the UI.
    console.log('New Device Information service added: ' + service.instanceId);
    if (deviceInfoDevicesMap.hasOwnProperty(service.deviceAddress))
      return;

    // Looks like it's a brand new device. Get information about the device so
    // that we can display the device name in the drop-down menu.
    chrome.bluetooth.getDevice(service.deviceAddress, function (device) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      storeDevice(device.address, device);
    });
  });

  // Track GATT services as they are removed.
  chrome.bluetoothLowEnergy.onServiceRemoved.addListener(function (service) {
    // Ignore, if the service is not a Device Information service.
    if (service.uuid != DEVICE_INFO_SERVICE_UUID)
      return;

    // See if this is the currently selected service. If so, unselect it.
    console.log('Device Information service removed: ' + service.instanceId);
    var selectedRemoved = false;
    if (deviceInfoService && deviceInfoService.instanceId == service.instanceId) {
      console.log('The selected service disappeared!');
      selectService(undefined);
      selectedRemoved = true;
    }

    // Remove the associated device from the map only if it has no other Device
    // Information services exposed (this will usually be the case)
    if (!deviceInfoDevicesMap.hasOwnProperty(service.deviceAddress))
      return;

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
          storeDevice(device.address, null);
          return;
        }

        var found = false;
        for (var i = 0; i < services.length; i++) {
          if (services[i].uuid == DEVICE_INFO_SERVICE_UUID) {
            found = true;
            break;
          }
        }

        if (found)
          return;

        console.log('Removing device: ' + device.address);
        storeDevice(device.address, null);
      });
    });
  });

  // Track GATT services as they change.
  chrome.bluetoothLowEnergy.onServiceChanged.addListener(function (service) {
    // This only matters if the selected service changed.
    if (!deviceInfoService || service.instanceId != deviceInfoService.instanceId)
      return;

    console.log('The selected service has changed');

    // Reselect the service to force an updated.
    selectService(service);
  });
}

document.addEventListener('DOMContentLoaded', main);
