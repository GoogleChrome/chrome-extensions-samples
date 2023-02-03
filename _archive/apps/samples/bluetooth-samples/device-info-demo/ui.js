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
    setFieldValue('manufacturer-name-string', null);
    setFieldValue('serial-number-string', null);
    setFieldValue('hardware-revision-string', null);
    setFieldValue('firmware-revision-string', null);
    setFieldValue('software-revision-string', null);
    setFieldValue('vendor-id-source', null);
    setFieldValue('vendor-id', null);
    setFieldValue('product-id', null);
    setFieldValue('product-version', null);
  };

  UI.prototype.setStringValue = function(id, buffer) {
    if (!buffer) {
      setFieldValue(id, null);
      return;
    }

    var valueString = String.fromCharCode.apply(null, new Uint8Array(buffer));
    setFieldValue(id, valueString);
  };

  UI.prototype.setPnpIdValue = function(id, buffer) {
    var vendorIdSource = null;
    var vendorId = null;
    var productId = null;
    var productVersion = null;

    var setPnpValues = function() {
      setFieldValue('vendor-id-source', vendorIdSource);
      setFieldValue('vendor-id', vendorId);
      setFieldValue('product-id', productId);
      setFieldValue('product-version', productVersion);
    };

    if (!buffer) {
      setPnpValues();
      return;
    }

    var valueBytes = new Uint8Array(buffer);
    if (valueBytes.length != 7) {
      setPnpValues();
      return;
    }

    var vendorIdSource = valueBytes[0];
    var vendorId = valueBytes[1] | valueBytes[2] << 8;
    var productId = valueBytes[3] | valueBytes[4] << 8;
    var productVersion = valueBytes[5] | valueBytes[6] << 8;

    setPnpValues();
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
      console.log('No connected devices found');
      placeHolder.appendChild(document.createTextNode('No connected devices'));
      return;
    }

    // Hide the placeholder and populate
    placeHolder.appendChild(document.createTextNode('Connected devices found'));

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
