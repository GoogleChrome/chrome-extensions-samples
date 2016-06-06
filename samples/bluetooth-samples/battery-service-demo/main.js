var main = (function() {
  // GATT Battery Service UUIDs
  var BATTERY_SERVICE_UUID  = '0000180f-0000-1000-8000-00805f9b34fb';
  var BATTERY_LEVEL_UUID    = '00002a19-0000-1000-8000-00805f9b34fb';

  function BatteryLevelDemo() {
    // A mapping from device addresses to device names for found devices that
    // expose a Battery service.
    this.deviceMap_ = {};

    // The currently selected service and its characteristic.
    this.service_ = null;
    this.batteryLevelChrc_ = null;
    this.discovering_ = false;
  }

  /**
   * Sets up the UI for the given service by retrieving its characteristic and
   * setting up notifications.
   */
  BatteryLevelDemo.prototype.selectService = function(service) {
    // Hide or show the appropriate elements based on whether or not
    // |serviceId| is undefined.
    UI.getInstance().resetState(!service);

    if (this.service_ && (!service || this.service_.deviceAddress !== service.deviceAddress)) {
      chrome.bluetoothLowEnergy.disconnect(this.service_.deviceAddress);
    }

    this.service_ = service;

    // Disable notifications from the currently selected Battery Level
    // characteristic.
    if (this.batteryLevelChrc_) {
      chrome.bluetoothLowEnergy.stopCharacteristicNotifications(
          this.batteryLevelChrc_.instanceId);
    }

    this.batteryLevelChrc_ = null;
    this.updateBatteryLevelValue();  // Initialize to unknown

    if (!service) {
      console.log('No service selected.');
      return;
    }

    console.log('GATT service selected: ' + service.instanceId);

    // Get the characteristics of the selected service.
    var self = this;
    chrome.bluetoothLowEnergy.getCharacteristics(service.instanceId,
                                                 function(chrcs) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      // Make sure that the same service is still selected.
      if (self.service_ && service.instanceId != self.service_.instanceId) {
        return;
      }

      if (chrcs.length == 0) {
        console.log('Service has no characteristics: ' + service.instanceId);
        return;
      }

      chrcs.forEach(function(chrc) {
        // This service should have only one characteristic.
        if (chrc.uuid != BATTERY_LEVEL_UUID) {
          console.log('Found unexpected characteristic: ' + chrc.instanceId +
                      ' with UUID: ' + chrc.uuid);
          return;
        }

        console.log('Setting Battery Level characteristic: ' + chrc.instanceId);
        self.batteryLevelChrc_ = chrc;

        // Enable notifications from the characteristic.
        chrome.bluetoothLowEnergy.startCharacteristicNotifications(
            chrc.instanceId,
            function() {
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
                                                            function(readChrc) {
            if (chrome.runtime.lastError) {
              console.log(chrome.runtime.lastError.message);
              return;
            }

            // Make sure that the same characteristic is still selected.
            if (readChrc.instanceId != self.batteryLevelChrc_.instanceId) {
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
  };

  BatteryLevelDemo.prototype.updateBatteryLevelValue = function() {
    if (!this.batteryLevelChrc_) {
      console.log('No Battery Level Characteristic selected');
      UI.getInstance().setBatteryLevel(null);
      return;
    }

    // Value field might be undefined if the read request failed or no
    // notification has been received yet.
    if (!this.batteryLevelChrc_.value) {
      console.log('No Battery Level value received yet');
      return;
    }

    var valueBytes = new Uint8Array(this.batteryLevelChrc_.value);

    // The value should contain a single byte.
    if (valueBytes.length != 1) {
      console.log('Invalid Battery Level value length: ' + valueBytes.length);
      return;
    }

    var batteryLevel = valueBytes[0];
    UI.getInstance().setBatteryLevel(batteryLevel);
  };

  BatteryLevelDemo.prototype.updateDiscoveryToggleState = function(discovering) {
    if (this.discovering_ !== discovering) {
      this.discovering_ = discovering;
      UI.getInstance().setDiscoveryToggleState(this.discovering_);
    }
  };

  BatteryLevelDemo.prototype.init = function() {
    // Set up the UI to look like no device was initially selected.
    this.selectService(null);

    // Store the |this| to be used by API callbacks below.
    var self = this;

    // Request information about the local Bluetooth adapter to be displayed in
    // the UI.
    var updateAdapterState = function(adapterState) {
      UI.getInstance().setAdapterState(adapterState.address, adapterState.name);
      self.updateDiscoveryToggleState(adapterState.discovering);
    };

    chrome.bluetooth.getAdapterState(function(adapterState) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }
      self.updateDiscoveryToggleState(adapterState.discovering);
      updateAdapterState(adapterState);
    });

    chrome.bluetooth.onAdapterStateChanged.addListener(updateAdapterState);

    // Helper functions used below.
    var isKnownDevice = function(deviceAddress) {
      return self.deviceMap_.hasOwnProperty(deviceAddress);
    };

    var storeDevice = function(deviceAddress, device) {
      var resetUI = false;
      if (device == null) {
        delete self.deviceMap_[deviceAddress];
        resetUI = true;
      } else {
        self.deviceMap_[deviceAddress] =
            (device.name ? device.name : deviceAddress);
      }

      // Update the selector UI with the new device list.
      UI.getInstance().updateDeviceSelector(self.deviceMap_, resetUI);
    };

    // Initialize the device map.
    chrome.bluetooth.getDevices(function(devices) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }

      if (devices) {
        devices.forEach(function(device) {
          // See if the device exposes a Battery service.
          chrome.bluetoothLowEnergy.getServices(device.address,
                                                function(services) {
            if (chrome.runtime.lastError) {
              console.log(chrome.runtime.lastError.message);
              return;
            }

            if (!services) {
              return;
            }

            var found = false;
            for (var i = 0; i < services.length; i++) {
              if (services[i].uuid == BATTERY_SERVICE_UUID) {
                console.log('Found Battery service!');
                found = true;
                break;
              }
            }

            if (!found) {
              return;
            }

            console.log('Found device with Battery service: ' +
                        device.address);
            storeDevice(device.address, device);
          });
        });
      }
    });

    // Set up discovery toggle button handler
    UI.getInstance().setDiscoveryToggleHandler(function() {
      var discoveryHandler = function() {
        if (chrome.runtime.lastError) {
          console.log('Failed to ' + (self.discovering_ ? 'stop' : 'start') + ' discovery ' +
                      chrome.runtime.lastError.message);
        }
      };
      if (self.discovering_) {
        chrome.bluetooth.stopDiscovery(discoveryHandler);
      } else {
        chrome.bluetooth.startDiscovery(discoveryHandler);
      }
    });

    // Set up the device selector.
    UI.getInstance().setDeviceSelectionHandler(function(selectedValue) {
      // If |selectedValue| is empty, unselect everything.
      if (!selectedValue) {
        self.selectService(null);
        return;
      }

      chrome.bluetoothLowEnergy.connect(selectedValue, function () {
        if (chrome.runtime.lastError) {
          console.log('Failed to connect to Battery device "' + selectedValue +
                      '" ' + chrome.runtime.lastError.message);
          return;
        }
        console.log('Connected to Battery device: ' + selectedValue);
      });

      // Request all GATT services of the selected device to see if it still has
      // a Battery service and pick the first one to display.
      chrome.bluetoothLowEnergy.getServices(selectedValue, function(services) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          self.selectService(undefined);
          return;
        }

        var foundService = null;
        for (var i = 0; i < services.length; i++) {
          if (services[i].uuid == BATTERY_SERVICE_UUID) {
            foundService = services[i];
            break;
          }
        }

        self.selectService(foundService);
      });
    });

    // Track devices that get added and removed. If they have the battery service
    // UUID in their advertisement data, then it will be available in the
    // |uuids| field of the device.
    chrome.bluetooth.onDeviceAdded.addListener(function (device) {
      if (!device.uuids || device.uuids.indexOf(BATTERY_SERVICE_UUID) < 0) {
        return;
      }

      if (self.deviceMap_.hasOwnProperty(device.address)) {
        return;
      }

      console.log('Found device with Battery service: ' + device.address);

      self.deviceMap_[device.address] =
          (device.name ? device.name : device.address);
      UI.getInstance().updateDeviceSelector(self.deviceMap_);
    });

    // Track devices as they are removed.
    chrome.bluetooth.onDeviceRemoved.addListener(function (device) {
      if (!self.deviceMap_.hasOwnProperty(device.address)) {
        return;
      }

      console.log('Battery device removed: ' + device.address);
      delete self.deviceMap_[device.address];
      if (self.service_ && self.service_.deviceAddress == device.address) {
        chrome.bluetoothLowEnergy.disconnect(device.address);
        self.selectService(undefined);
        UI.getInstance().triggerDeviceSelection();
      }
      UI.getInstance().updateDeviceSelector(self.deviceMap_);
    });

    // Track GATT services as they are added.
    chrome.bluetoothLowEnergy.onServiceAdded.addListener(function(service) {
      // Ignore, if the service is not a Battery service.
      if (service.uuid != BATTERY_SERVICE_UUID) {
        return;
      }

      // If this came from the currently selected device and no service is
      // currently selected, select this service.
      if (UI.getInstance().getSelectedDeviceAddress() == service.deviceAddress
          && !self.service_) {
        self.selectService(service);
      }

      // Add the device of the service to the device map and update the UI.
      console.log('New Battery service added: ' + service.instanceId);
      if (isKnownDevice(service.deviceAddress)) {
        return;
      }

      // Looks like it's a brand new device. Get information about the device so
      // that we can display the device name in the drop-down menu.
      chrome.bluetooth.getDevice(service.deviceAddress, function(device) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }

        storeDevice(device.address, device);
      });
    });

    // Track GATT services as they are removed.
    chrome.bluetoothLowEnergy.onServiceRemoved.addListener(function(service) {
      // Ignore, if the service is not a Battery service.
      if (service.uuid != BATTERY_SERVICE_UUID) {
        return;
      }

      // See if this is the currently selected service. If so, unselect it.
      console.log('Battery service removed: ' + service.instanceId);
      var selectedRemoved = false;
      if (self.service_ && self.service_.instanceId == service.instanceId) {
        console.log('The selected service disappeared!');
        self.selectService(null);
        selectedRemoved = true;
      }

      // Remove the associated device from the map only if it has no other Battery
      // services exposed (this will usually be the case)
      if (!isKnownDevice(service.deviceAddress)) {
        return;
      }

      chrome.bluetooth.getDevice(service.deviceAddress, function(device) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }

        chrome.bluetoothLowEnergy.getServices(device.address,
                                              function(services) {
          if (chrome.runtime.lastError) {
            // Error obtaining services. Remove the device from the map.
            console.log(chrome.runtime.lastError.message);
            storeDevice(device.address, null);
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
          storeDevice(device.address, null);
        });
      });
    });

    // Track GATT services as they change.
    chrome.bluetoothLowEnergy.onServiceChanged.addListener(function(service) {
      // This only matters if the selected service changed.
      if (!self.service_ || service.instanceId != self.service_.instanceId) {
        return;
      }

      console.log('The selected service has changed');

      // Reselect the service to force an updated.
      self.selectService(service);
    });

    // Track GATT characteristic value changes. This event will be triggered after
    // successful characteristic value reads and received notifications and
    // indications.
    chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(
        function(chrc) {
      if (self.batteryLevelChrc_ &&
          chrc.instanceId == self.batteryLevelChrc_.instanceId) {
        console.log('Battery Level value changed');
        self.batteryLevelChrc_ = chrc;
        self.updateBatteryLevelValue();
        return;
      }
    });
  };

  return {
    BatteryLevelDemo: BatteryLevelDemo
  };

})();

document.addEventListener('DOMContentLoaded', function() {
  var demo = new main.BatteryLevelDemo();
  demo.init();
});
