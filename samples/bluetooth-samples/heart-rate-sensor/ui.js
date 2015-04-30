var UI = (function() {

  // Common functions used for tweaking UI elements.
  function UI() {
  }

  // Global instance.
  var instance;

  UI.prototype.resetState = function(noDevices) {
    document.getElementById('no-devices-error').hidden = !noDevices;
    document.getElementById('info-div').hidden = noDevices;
    this.clearAllFields();
  };

  UI.prototype.clearAllFields = function() {
    this.setHeartRateMeasurement(null);
    this.setSensorContactStatus(null);
    this.setEnergyExpanded(null);
    this.setRRInterval(null);
    this.setBodySensorLocation(null);
    this.setResetButtonEnabled(false);
  };

  UI.prototype.setHeartRateMeasurement = function(value) {
    setFieldValue('heart-rate-measurement', value);
  };

  UI.prototype.setSensorContactStatus = function(value) {
    setFieldValue('sensor-contact-status', value);
  };

  UI.prototype.setEnergyExpanded = function(value) {
    setFieldValue('energy-expanded', value);
  };

  UI.prototype.setRRInterval = function(value) {
    setFieldValue('rr-interval', value);
  };

  UI.prototype.setBodySensorLocation = function(value) {
    setFieldValue('body-sensor-location', value);
  };

  UI.prototype.setResetButtonEnabled = function(enabled) {
    document.getElementById('heart-rate-control-point').disabled = !enabled;
  };

  UI.prototype.setResetEnergyExpandedHandler = function(handler) {
    document.getElementById('heart-rate-control-point').onclick = handler;
  };

  UI.prototype.setDiscoveryToggleState = function(isDiscoverying) {
    var discoveryToggleButton = document.getElementById('discovery-toggle-button');
    if (isDiscoverying) {
      discoveryToggleButton.innerHTML = 'stop discovery';
    } else {
      discoveryToggleButton.innerHTML = 'start discovery';
    }
  };

  UI.prototype.setDiscoveryToggleHandler = function(handler) {
    var discoveryToggleButton = document.getElementById('discovery-toggle-button');
    discoveryToggleButton.onclick = handler;
  };

  UI.prototype.setDeviceSelectionHandler = function(handler) {
    var deviceSelector =  document.getElementById('device-selector');
    deviceSelector.onchange = function() {
      handler(deviceSelector[deviceSelector.selectedIndex].value);
    };
  };

  UI.prototype.triggerDeviceSelection = function() {
    var deviceSelector = document.getElementById('device-selector');
    if (deviceSelector.onchange)
      deviceSelector.onchange();
  };

  UI.prototype.getSelectedDeviceAddress = function() {
    var deviceSelector = document.getElementById('device-selector');
    return deviceSelector[deviceSelector.selectedIndex].value;
  };

  UI.prototype.updateDeviceSelector = function(deviceMap, reset) {
    var deviceSelector = document.getElementById('device-selector');
    var placeHolder = document.getElementById('placeholder');
    var addresses = Object.keys(deviceMap);

    reset = (reset !== undefined) ? reset : false;

    deviceSelector.innerHTML = '';
    placeHolder.innerHTML = '';
    deviceSelector.appendChild(placeHolder);

    // Clear the drop-down menu.
    if (addresses.length == 0) {
      console.log('No heart rate devices found');
      placeHolder.appendChild(document.createTextNode('No HR devices found'));
      return;
    }

    // Hide the placeholder and populate
    placeHolder.appendChild(document.createTextNode('HR devices found'));

    for (var i = 0; i < addresses.length; i++) {
      var address = addresses[i];
      var deviceOption = document.createElement('option');
      deviceOption.setAttribute('value', address);
      deviceOption.appendChild(document.createTextNode(
          deviceMap[address]));
      deviceSelector.appendChild(deviceOption);
    }

    if (reset)
      deviceSelector.selectedIndex = 0;
  };

  UI.prototype.setAdapterState = function(address, name) {
    var addressField = document.getElementById('adapter-address');
    var nameField = document.getElementById('adapter-name');

    var setAdapterField = function (field, value) {
      field.innerHTML = '';
      field.appendChild(document.createTextNode(value));
    };

    setAdapterField(addressField, address ? address : 'unknown');
    setAdapterField(nameField, name ? name : 'Local Adapter');
  };

  // private methods:

  function setFieldValue(id, value) {
    var div = document.getElementById(id);
    div.innerHTML = '';
    div.appendChild(
        document.createTextNode((value == null) ? '-' : value));
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = new UI();
      }

      return instance;
    }
  };

})();
