var main = (function() {
  // GATT Heart Rate Service UUIDs
  var HEART_RATE_SERVICE_UUID       = '0000180d-0000-1000-8000-00805f9b34fb';
  var HEART_RATE_MEASUREMENT_UUID   = '00002a37-0000-1000-8000-00805f9b34fb';
  var BODY_SENSOR_LOCATION_UUID     = '00002a38-0000-1000-8000-00805f9b34fb';
  var HEART_RATE_CONTROL_POINT_UUID = '00002a39-0000-1000-8000-00805f9b34fb';

  function HeartRateSensor() {
    // A mapping from device addresses to device names for found devices that
    // expose a Heart Rate service.
    this.deviceMap_ = {};

    // The currenty selected service and its characteristics.
    this.service_ = null;
    this.measurementChrc_ = null;
    this.energyExpandedChrc_ = null;
    this.bodySensorLocChrc_ = null;
    this.controlPointChrc_ = null;
    this.discovering_ = false;
  }

  /**
   * Sets up the UI for the given service by retrieving the initial values of
   * all relevant characteristics and performing other necessary set up.
   */
  HeartRateSensor.prototype.selectService = function(service) {
    // Hide or show the appropriate elements based on whether or not
    // |serviceId| is undefined.
    UI.getInstance().resetState(!service);

    if (this.service_ && (!service || this.service_.deviceAddress !== service.deviceAddress)) {
      chrome.bluetoothLowEnergy.disconnect(this.service_.deviceAddress);
    }

    this.service_ = service;

    // Disable notifications from the currently selected Heart Rate Measurement
    // characteristic
    if (this.measurementChrc_) {
      chrome.bluetoothLowEnergy.stopCharacteristicNotifications(
          this.measurementChrc_.instanceId);
    }

    this.measurementChrc_ = null;
    this.bodySensorLocChrc_ = null;
    this.controlPointChrc_ = null;
    this.energyExpandedChrc_ = null;
    if (!service) {
      console.log('No service selected.');
      return;
    }

    console.log('GATT service selected: ' + service.instanceId);

    // Get the characteristics of the selected service.
    var self = this;
    chrome.bluetoothLowEnergy.getCharacteristics(service.instanceId,
                                                 function (chrcs) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      // Make sure that the same service is still selected.
      if (service.instanceId != self.service_.instanceId) {
        return;
      }

      if (chrcs.length == 0) {
        console.log('Service has no characteristics: ' + service.instanceId);
        return;
      }

      chrcs.forEach(function (chrc) {
        if (chrc.uuid == HEART_RATE_MEASUREMENT_UUID) {
          console.log('Setting Heart Rate Measurement Characteristic: ' +
                      chrc.instanceId);
          self.measurementChrc_ = chrc;
          self.updateHeartRateMeasurementValue();

          // Enable notifications from the characteristic.
          chrome.bluetoothLowEnergy.startCharacteristicNotifications(
              chrc.instanceId,
              function () {
            if (chrome.runtime.lastError) {
              console.log(
                  'Failed to enable Heart Rate Measurement notifications: ' +
                   chrome.runtime.lastError.message);
              return;
            }

            console.log('Heart Rate Measurement notifications enabled!');
          });
          return;
        }

        if (chrc.uuid == BODY_SENSOR_LOCATION_UUID) {
          console.log('Setting Body Sensor Location Characteristic: ' +
                      chrc.instanceId);
          self.bodySensorLocChrc_ = chrc;

          // Read the value of the characteristic once and store it.
          chrome.bluetoothLowEnergy.readCharacteristicValue(
              chrc.instanceId,
              function (readChrc) {
            if (chrome.runtime.lastError) {
              console.log(chrome.runtime.lastError.message);
              return;
            }

            // Make sure that the same characteristic is still selected.
            if (readChrc.instanceId != self.bodySensorLocChrc_.instanceId) {
              return;
            }

            self.bodySensorLocChrc_ = readChrc;
            self.updateBodySensorLocationValue();
          });

          return;
        }

        if (chrc.uuid == HEART_RATE_CONTROL_POINT_UUID) {
          console.log('Setting Heart Rate Control Point Characteristic: ' +
                      chrc.instanceId);
          self.controlPointChrc_ = chrc;
          UI.getInstance().setResetButtonEnabled(true);
          return;
        }
      });
    });
  };

  HeartRateSensor.prototype.updateHeartRateMeasurementValue = function() {
    if (!this.measurementChrc_) {
      console.log('No Heart Rate Measurement Characteristic selected');
      return;
    }

    // The Heart Rate Measurement Characteristic does not allow 'read'
    // operations and its value can only be obtained via notifications, so the
    // |value| field might be undefined here.
    if (!this.measurementChrc_.value) {
      console.log('No Heart Rate Measurement value received yet');
      return;
    }

    var valueBytes = new Uint8Array(this.measurementChrc_.value);
    if (valueBytes.length < 2) {
      console.log('Invalid Heart Rate Measurement value');
      return;
    }

    // The first byte is the flags field.
    var flags = valueBytes[0];

    // The least significant bit is the Heart Rate Value format. If 0, the heart
    // rate measurement is expressed in the next byte of the value. If 1, it is
    // a 16 bit value expressed in the next two bytes of the value.
    var hrFormat = flags & 0x01;

    // The next two bits is the Sensor Contact Status.
    var sensorContactStatus = (flags >> 1) & 0x03;

    // The next bit is the Energy Expanded Status. If 1, the Energy Expanded
    // field is present in the characteristic value.
    var eeStatus = (flags >> 3) & 0x01;

    // The next bit is the RR-Interval bit. If 1, RR-Interval values are
    // present.
    var rrBit = (flags >> 4) & 0x01;

    var heartRateMeasurement;
    var energyExpanded;
    var rrInterval;
    var minLength = hrFormat == 1 ? 3 : 2;
    if (valueBytes.length < minLength) {
      console.log('Invalid Heart Rate Measurement value');
      return;
    }

    if (hrFormat == 0) {
      console.log('8-bit Heart Rate format');
      heartRateMeasurement = valueBytes[1];
    } else {
      console.log('16-bit Heart Rate format');
      heartRateMeasurement = valueBytes[1] | (valueBytes[2] << 8);
    }

    var nextByte = minLength;
    if (eeStatus == 1) {
      if (valueBytes.length < nextByte + 2) {
        console.log('Invalid value for "Energy Expanded"');
        return;
      }

      console.log('Energy Expanded field present');
      energyExpanded = valueBytes[nextByte] | (valueBytes[nextByte + 1] << 8);
      nextByte += 2;
    }

    if (rrBit == 1) {
      if (valueBytes.length < nextByte + 2) {
        console.log('Invalid value for "RR-Interval"');
        return;
      }

      console.log('RR-Interval field present');

      // Note: According to the specification, there can be several RR-Interval
      // values in a characteristic value, however we're just picking the first
      // one here for demo purposes.
      rrInterval = valueBytes[nextByte] | (valueBytes[nextByte + 1] << 8);
    }

    UI.getInstance().setHeartRateMeasurement(heartRateMeasurement);
    UI.getInstance().setSensorContactStatus((function() {
      switch (sensorContactStatus) {
      case 0:
      case 1:
        return 'not supported';
      case 2:
        return 'contact not detected';
      case 3:
        return 'contact detected';
      default:
        return;
      }
    })());

    if (energyExpanded !== undefined) {
        this.energyExpandedChrc_ = energyExpanded;
    }

    UI.getInstance().setEnergyExpanded(this.energyExpandedChrc_);
    UI.getInstance().setRRInterval(rrInterval);
  };

  HeartRateSensor.prototype.updateBodySensorLocationValue = function() {
    if (!this.bodySensorLocChrc_) {
      console.log('No Body Sensor Location Characteristic selected');
      return;
    }

    // Since this function is called after a read request, the value should be
    // present if the read was successful but it may be undefined if the read
    // failed, so check here.
    if (!this.bodySensorLocChrc_.value) {
      console.log('No Body Sensor Location has been read');
      return;
    }

    var valueBytes = new Uint8Array(this.bodySensorLocChrc_.value);
    if (valueBytes.length != 1) {
      console.log('Invalid Body Sensor Location value');
      return;
    }

    var bodySensorLocation = (function () {
      switch (valueBytes[0]) {
      case 0:
        return 'Other';
      case 1:
        return 'Chest';
      case 2:
        return 'Wrist';
      case 3:
        return 'Finger';
      case 4:
        return 'Hand';
      case 5:
        return 'Ear Lobe';
      case 6:
        return 'Foot';
      default:
        return;
      }
    })();

    UI.getInstance().setBodySensorLocation(bodySensorLocation);
  };

  HeartRateSensor.prototype.resetEnergyExpanded = function() {
    if (!this.controlPointChrc_) {
      console.log('No Heart Rate Control Point characteristic selected');
      return;
    }

    var writeValue = new ArrayBuffer(1);
    var writeBytes = new Uint8Array(writeValue);
    writeBytes[0] = 1;  // '1' indicates a 'reset' command.

    chrome.bluetoothLowEnergy.writeCharacteristicValue(
        this.controlPointChrc_.instanceId,
        writeValue,
        function () {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      console.log('Heart Rate Control Point Characteristic written!');
    });
  };

  HeartRateSensor.prototype.updateDiscoveryToggleState = function(discovering) {
    if (this.discovering_ !== discovering) {
      this.discovering_ = discovering;
      UI.getInstance().setDiscoveryToggleState(this.discovering_);
    }
  };

  HeartRateSensor.prototype.init = function() {
    // Set up the UI to look like no device was initially selected.
    this.selectService(undefined);

    var self = this;
    // Request information about the local Bluetooth adapter to be displayed in
    // the UI.
    var updateAdapterState = function(adapterState) {
      UI.getInstance().setAdapterState(adapterState.address, adapterState.name);
      self.updateDiscoveryToggleState(adapterState.discovering);
    };

    chrome.bluetooth.getAdapterState(function (adapterState) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }

      self.updateDiscoveryToggleState(adapterState.discovering);
      updateAdapterState(adapterState);
    });

    chrome.bluetooth.onAdapterStateChanged.addListener(updateAdapterState);

    // Initialize the device map.
    chrome.bluetooth.getDevices(function (devices) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
      }

      if (devices) {
        devices.forEach(function (device) {
          if (device.uuids &&
              device.uuids.indexOf(HEART_RATE_SERVICE_UUID) > -1) {
            if (!self.deviceMap_.hasOwnProperty(device.address)) {
              self.deviceMap_[device.address] =
                  (device.name ? device.name : device.address);
              UI.getInstance().updateDeviceSelector(self.deviceMap_);
            }
            return;
          }

          // See if the device exposes a Heart Rate service.
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
              if (service.uuid == HEART_RATE_SERVICE_UUID) {
                console.log('Found Heart Rate service!');
                found = true;
              }
            });

            if (!found) {
              return;
            }

            if (!self.deviceMap_.hasOwnProperty(device.address)) {
              console.log('Found device with Heart Rate service: ' +
                          device.address);
              self.deviceMap_[device.address] =
                  (device.name ? device.name : device.address);
              UI.getInstance().updateDeviceSelector(self.deviceMap_);
            }
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
    UI.getInstance().setDeviceSelectionHandler(function (selectedValue) {
      // If |selectedValue| is empty, unselect everything.
      if (!selectedValue) {
        self.selectService(undefined);
        return;
      }

      chrome.bluetoothLowEnergy.connect(selectedValue, function () {
        if (chrome.runtime.lastError) {
          console.log('Failed to connect to HR device "' + selectedValue +
                      '" ' + chrome.runtime.lastError.message);
          return;
        }
        console.log('Connected to HR device: ' + selectedValue);
      });

      // Request all GATT services of the selected device to see if it still has
      // a Heart Rate service and pick the first Heart Rate service to display.
      chrome.bluetoothLowEnergy.getServices(selectedValue, function (services) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          self.selectService(undefined);
          return;
        }

        var foundService = undefined;
        services.forEach(function (service) {
          if (service.uuid == HEART_RATE_SERVICE_UUID) {
            foundService = service;
          }
        });

        self.selectService(foundService);
      });
    });

    // Set up the "Reset Energy Expanded" button action.
    UI.getInstance().setResetEnergyExpandedHandler(function() {
      self.resetEnergyExpanded();
    });

    // Track devices that get added and removed. If they have the heart rate
    // UUID in their advertisement data, then it will be available in the
    // |uuids| field of the device.
    chrome.bluetooth.onDeviceAdded.addListener(function (device) {
      if (!device.uuids || device.uuids.indexOf(HEART_RATE_SERVICE_UUID) < 0) {
        return;
      }

      if (self.deviceMap_.hasOwnProperty(device.address)) {
        return;
      }

      console.log('Found device with HR service: ' + device.address);

      self.deviceMap_[device.address] =
          (device.name ? device.name : device.address);
      UI.getInstance().updateDeviceSelector(self.deviceMap_);
    });

    // Track devices as they are removed.
    chrome.bluetooth.onDeviceRemoved.addListener(function (device) {
      if (!self.deviceMap_.hasOwnProperty(device.address)) {
        return;
      }

      console.log('HR device removed: ' + device.address);
      delete self.deviceMap_[device.address];
      if (self.service_ && self.service_.deviceAddress == device.address) {
        chrome.bluetoothLowEnergy.disconnect(device.address);
        self.selectService(undefined);
        UI.getInstance().triggerDeviceSelection();
      }
      UI.getInstance().updateDeviceSelector(self.deviceMap_);
    });

    // Track GATT services as they are added.
    chrome.bluetoothLowEnergy.onServiceAdded.addListener(function (service) {
      // Ignore, if the service is not a Heart Rate service.
      if (service.uuid != HEART_RATE_SERVICE_UUID) {
        return;
      }

      // If this came from the currently selected device and no service is
      // currently selected, select this service.
      if (UI.getInstance().getSelectedDeviceAddress() == service.deviceAddress
          && !self.service_) {
        self.selectService(service);
      }

      // Add the device of the service to the device map and update the UI.
      console.log('New Heart Rate service added: ' + service.instanceId);
      if (self.deviceMap_.hasOwnProperty(service.deviceAddress)) {
        return;
      }

      // Looks like it's a brand new device. Get information about the device so
      // that we can display the device name in the drop-down menu.
      chrome.bluetooth.getDevice(service.deviceAddress, function (device) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }

        self.deviceMap_[device.address] =
            (device.name ? device.name : device.address);
        UI.getInstance().updateDeviceSelector(self.deviceMap_);
      });
    });

    // Track GATT services as they are removed.
    chrome.bluetoothLowEnergy.onServiceRemoved.addListener(function (service) {
      // Ignore, if the service is not a Heart Rate service.
      if (service.uuid != HEART_RATE_SERVICE_UUID) {
        return;
      }

      // See if this is the currently selected service. If so, unselect it.
      console.log('Heart Rate service removed: ' + service.instanceId);
      var selectedRemoved = false;
      if (self.service_ && self.service_.instanceId == service.instanceId) {
        console.log('The selected service disappeared!');
        self.selectService(undefined);
        selectedRemoved = true;
        UI.getInstance().updateDeviceSelector(self.deviceMap_,
                                              true /* reset */);
      }

      // Remove the associated device from the map only if it no longer lists
      // the Heart Rate UUID.
      if (!self.deviceMap_.hasOwnProperty(service.deviceAddress)) {
        return;
      }

      chrome.bluetooth.getDevice(service.deviceAddress, function (device) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          return;
        }

        if (!device.uuids || device.uuids.indexOf(HEART_RATE_SERVICE_UUID) < 0) {
          console.log('Removing device: ' + device.address);
          delete self.deviceMap_[device.address];
          UI.getInstance().updateDeviceSelector(self.deviceMap_);
        }

        if (selectedRemoved) {
          UI.getInstance().triggerDeviceSelection();
        }
      });
    });

    // Track GATT services as they change.
    chrome.bluetoothLowEnergy.onServiceChanged.addListener(function (service) {
      // This only matters if the selected service changed.
      if (!self.service_ ||
          service.instanceId != self.service_.instanceId) {
        return;
      }

      console.log('The selected service has changed');

      // Reselect the service to force an updated.
      self.selectService(service);
    });

    // Track GATT characteristic value changes. This event will be triggered
    // after successful characteristic value reads and received notifications
    // and indications.
    chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(
        function (chrc) {
      if (self.measurementChrc_ &&
          chrc.instanceId == self.measurementChrc_.instanceId) {
        console.log('Heart Rate Measurement value changed');
        self.measurementChrc_ = chrc;
        self.updateHeartRateMeasurementValue();
        return;
      }
    });
  };

  return {
    HeartRateSensor: HeartRateSensor
  };

})();

document.addEventListener('DOMContentLoaded', function() {
  var sensor = new main.HeartRateSensor();
  sensor.init();
});
