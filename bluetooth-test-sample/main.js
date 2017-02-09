// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

test = {};

test.ab2str = function(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

test.str2ab = function(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

test.log = function(msg, button, callback) {
	var msg_str = (typeof(msg) == 'object') ? JSON.stringify(msg) : msg;

	if (test.logElement) {
		if (button) {
			var textElement = document.createTextNode(msg_str);
			test.logElement.appendChild(textElement);

			var element = document.createElement('input');
			element.type = 'button';
			element.value = button;
			test.logElement.appendChild(element);
			element.addEventListener('click', function() {
				callback();
				test.logElement.removeChild(element);
			});

			textElement = document.createTextNode('\n');
			test.logElement.appendChild(textElement);
		} else {
			test.logElement.appendChild(document.createTextNode(msg_str + '\n'));
		}
		test.logElement.scrollTop = test.logElement.scrollHeight;
	}
};

test.error = function(msg) {
	test.log(msg);
	console.log(msg);
};

test.failed = function() {
	if (chrome.runtime.lastError) {
		test.error('Failed: ' + chrome.runtime.lastError.message);
		return true;
	} else {
		return false;
	}
};

test.errorIf = function(cond, msg) {
	if (cond) {
		test.error(msg);
		return true;
	} else {
		test.clearError(msg);
		return false;
	}
};

test.clearLog = function() {
	if (test.logElement) {
		test.logElement.innerHTML = '';
	}
};

test.getMode = function() {
	var modes = [ 'listen', 'connect', 'reconnect' ];
	for (var i = 0; i < modes.length; i++) {
		if (document.getElementById(modes[i]).checked)
			return modes[i];
	}
};

test.getDataMode = function() {
	var modes = [ 'receive', 'send', 'both', 'ping' ];
	for (var i = 0; i < modes.length; i++) {
		if (document.getElementById(modes[i]).checked)
			return modes[i];
	}
};

test.getProtocol = function() {
	var modes = [ 'rfcomm', 'l2cap' ];
	for (var i = 0; i < modes.length; i++) {
		if (document.getElementById(modes[i]).checked)
			return modes[i];
	}
};

test.getChecked = function(key) {
	return document.getElementById(key).checked;
};

test.getValue = function(key) {
	return document.getElementById(key).value;
};


test.Bluetooth = function() {
	this.discovering = false;
	this.devices = {};
	this.deviceOptions = {};
	this.servers = [];
	this.clients = [];

	if (!chrome.bluetooth) {
		test.error('Bluetooth support missing in this build of Chrome');
		return;
	}

	this.monitorAdapterState();
	this.monitorDevices();
};

test.Bluetooth.prototype.monitorAdapterState = function() {
	this.adapterAddressElement = document.getElementById('adapter_address');
	this.adapterNameElement = document.getElementById('adapter_name');

	var self = this;
	chrome.bluetooth.onAdapterStateChanged.addListener(function(adapterState) {
		self.setAdapterState(adapterState);
	});
	chrome.bluetooth.getAdapterState(function(adapterState) {
		if (test.failed()) return;
		self.setAdapterState(adapterState);
	});
};

test.Bluetooth.prototype.setAdapterState = function(adapterState) {
	this.adapterState = adapterState;

	this.adapterAddressElement.innerHTML = adapterState.address;
	this.adapterNameElement.innerHTML = adapterState.name;

	this.updateDiscoveringState();

	if (test.errorIf(!adapterState.available, 'No Bluetooth adapter available'))
		return;
	if (test.errorIf(!adapterState.powered, 'Bluetooth is not enabled'))
		return;
};

test.Bluetooth.prototype.monitorDevices = function() {
	this.deviceAddressElement = document.getElementById('device_address');

	var self = this;
	chrome.bluetooth.onDeviceAdded.addListener(function(device) {
		self.createOrUpdateDevice(device);
	});
	chrome.bluetooth.onDeviceChanged.addListener(function(device) {
		self.createOrUpdateDevice(device);
	});
	chrome.bluetooth.onDeviceRemoved.addListener(function(device) {
		self.removeDevice(device);
	});

	this.updateDiscoveringState();

	chrome.bluetooth.getDevices(function(devices) {
		if (test.failed()) return;
		for (var i = 0; i < devices.length; i++) {
			self.createOrUpdateDevice(devices[i]);
		}
	});
};

test.Bluetooth.prototype.createOrUpdateDevice = function(device) {
	this.devices[device.address] = device;

	var option = this.deviceOptions[device.address];
	if (option == undefined) {
		test.log('New device: ' + device.name + ' (' + device.address + ')');
		option = document.createElement('option');
		this.deviceOptions[device.address] = option;

		option.value = device.address;
		this.deviceAddressElement.appendChild(option);
	} else if (option.innerHTML != device.name) {
		test.log('Device name changed: ' + device.name +
			' (was ' + option.innerHTML + ')');
	}

	option.innerHTML = device.name;
};

test.Bluetooth.prototype.removeDevice = function(device) {
	this.devices[device.address] = undefined;
	var option = this.deviceOptions[device.address];
	if (option != undefined) {
		test.log('Removed device: ' + device.name + ' (' + device.address + ')');
		this.deviceAddressElement.removeChild(option);
		this.deviceOptions[device.address] = undefined;
	}
};

test.Bluetooth.prototype.updateDiscoveringState = function() {
	if (!this.adapterState) return;
	if (!this.discovering) return;
	if (this.adapterState.available && this.adapterState.powered)
		return;

	// On power-down, discovery is automatically stopped. Just update our state.
	this.discovering = false;
	test.log('Discovery stopped by adapter');
};

test.Bluetooth.prototype.start = function() {
	var mode = test.getMode();
	if (mode == 'listen') {
		var server = new test.BluetoothServer(this);

		server.protocol = test.getProtocol();
		if (server.protocol == 'rfcomm') {
			server.uuid = test.getValue('rfcomm_uuid');
			if (test.getChecked('rfcomm_use_channel'))
				server.channel = parseInt(test.getValue('rfcomm_channel'));
		} else if (server.protocol == 'l2cap') {
			server.uuid = test.getValue('l2cap_uuid');
			if (test.getChecked('l2cap_use_psm'))
				server.psm = parseInt(test.getValue('l2cap_psm'));
		}

		server.datamode = test.getDataMode();

		this.addServer(server);
		server.start();
	} else {
		var client = new test.BluetoothClient(this);
		client.mode = mode;

		var protocol = test.getProtocol();
		if (protocol == 'rfcomm') {
			client.uuid = test.getValue('rfcomm_uuid');
		} else if (protocol == 'l2cap') {
			client.uuid = test.getValue('l2cap_uuid');
		}

		client.device = this.devices[test.getValue('device_address')];
		client.datamode = test.getDataMode();

		this.addClient(client);
		client.connect();
	}
};

test.Bluetooth.prototype.addServer = function(server) {
	this.servers.push(server);
};

test.Bluetooth.prototype.removeServer = function(server) {
	var index = this.servers.indexOf(server);
	if (index != -1)
		this.servers.splice(index, 1);
};

test.Bluetooth.prototype.addClient = function(client) {
	this.clients.push(client);
};

test.Bluetooth.prototype.removeClient = function(client) {
	var index = this.clients.indexOf(client);
	if (index != -1)
		this.clients.splice(index, 1);
};

test.Bluetooth.prototype.startDiscovery = function() {
	var self = this;
	chrome.bluetooth.startDiscovery(function() {
		if (chrome.runtime.lastError) {
			test.error('Discovery failed: ' + chrome.runtime.lastError.message);
			return;
		}

		self.discovering = true;
		test.log('Discovery started',
			'Stop', function() {
				self.stopDiscovery();
			});
	});

};

test.Bluetooth.prototype.stopDiscovery = function() {
	var self = this;
	chrome.bluetooth.stopDiscovery(function() {
		if (chrome.runtime.lastError) {
			test.error('Stop discovery failed: ' + chrome.runtime.lastError.message);
			return;
		}

		self.discovering = false;
		test.log('Discovery stopped');
	});
};


test.BluetoothServer = function(app) {
	this.app = app;
	this.protocol = 'rfcomm';
	this.datamode = 'receive';
	this.uuid = '9991';
};

test.BluetoothServer.prototype.start = function() {
	var self = this;
	chrome.bluetoothSocket.create(function(socketInfo) {
		if (test.failed()) return;
		self.socketId = socketInfo.socketId;
		test.log('[' + self.socketId + '] Socket created');

		chrome.bluetoothSocket.onAccept.addListener(function(acceptInfo) {
			if (acceptInfo.socketId != socketInfo.socketId) return;
			self.onAccept(acceptInfo);
		});
		chrome.bluetoothSocket.onAcceptError.addListener(function(errorInfo) {
			if (errorInfo.socketId != socketInfo.socketId) return;
			self.onAcceptError(errorInfo);
		});

		var options = {};
		if (self.protocol == 'rfcomm') {
			if (self.channel != undefined)
				options.channel = self.channel;

			chrome.bluetoothSocket.listenUsingRfcomm(
				socketInfo.socketId, self.uuid, options,
				function() {
					if (chrome.runtime.lastError) {
						test.error('[' + self.socketId + '] Listen failed: ' +
							chrome.runtime.lastError.message);
						chrome.bluetoothSocket.close(socketInfo.socketId);
						return;
					}

					test.log(
						'[' + self.socketId + '] Listening on RFCOMM channel ' +
						self.channel,
						'Stop', function() {
							self.stop();
						});
				});
		} else if (self.protocol == 'l2cap') {
			if (self.psm != undefined)
				options.psm = self.psm;

			chrome.bluetoothSocket.listenUsingL2cap(
				socketInfo.socketId, self.uuid, options,
				function() {
					if (chrome.runtime.lastError) {
						test.error('[' + self.socketId + '] Listen failed: ' +
							chrome.runtime.lastError.message);
						chrome.bluetoothSocket.close(socketInfo.socketId);
						return;
					}

					test.log(
						'[' + self.socketId + '] Listening on L2CAP PSM ' + self.psm,
						'Stop', function() {
							self.stop();
						});
				});
		}
	});
};

test.BluetoothServer.prototype.onAccept = function(acceptInfo) {
	// TODO(keybuk): do something with the connection.
	// remember that the client socket is paused.
	test.log('[' + this.socketId + '] Connection accepted');

	var client = new test.BluetoothClient(this.app);
	client.socketId = acceptInfo.clientSocketId;
	client.uuid = this.uuid;
	client.device = '...';
	client.datamode = this.datamode;

	this.app.addClient(client);
	client.start();
};

test.BluetoothServer.prototype.onAcceptError = function(errorInfo) {
	// TODO(keybuk): do something with the error
	// socket should be paused? close it?
	test.error('[' + this.socketId + '] Accept error: ' + errorInfo.errorMessage);
};

test.BluetoothServer.prototype.stop = function() {
	var self = this;
	chrome.bluetoothSocket.disconnect(this.socketId, function() {
		if (chrome.runtime.lastError) {
			test.error('[' + self.socketId + '] Disconnect failed: ' +
				chrome.runtime.lastError.message);
		} else {
			test.log('[' + self.socketId + '] Stopped');
		}

		chrome.bluetoothSocket.close(self.socketId);
		self.app.removeServer(self);
		self.socketId = undefined;
	});
};


test.BluetoothClient = function(app) {
	this.app = app;
	this.device = {};
	this.mode = 'connect';
	this.datamode = 'receive';
	this.uuid = '9991';

	this.dataLen = 627;
};

test.BluetoothClient.prototype.connect = function() {
	var self = this;
	chrome.bluetoothSocket.create(function(socketInfo) {
		if (test.failed()) return;
		self.socketId = socketInfo.socketId;
		test.log('[' + self.socketId + '] Socket created');

		chrome.bluetoothSocket.onReceive.addListener(function(receiveInfo) {
			if (receiveInfo.socketId != socketInfo.socketId) return;
			self.onReceive(receiveInfo);
		});
		chrome.bluetoothSocket.onReceiveError.addListener(function(errorInfo) {
			if (errorInfo.socketId != socketInfo.socketId) return;
			self.onReceiveError(errorInfo);
		});

		chrome.bluetoothSocket.connect(
			socketInfo.socketId, self.device.address, self.uuid,
			function() {
				if (chrome.runtime.lastError) {
					test.error('[' + self.socketId + '] Connect failed: ' +
						chrome.runtime.lastError.message);
					chrome.bluetoothSocket.close(socketInfo.socketId);
					return;
				}

				var msg = '[' + self.socketId + '] Connected to ' +
					self.device.address;
				if (self.mode != 'reconnect') {
					test.log(msg,
						'Disconnect', function() {
							self.disconnect();
						});
				} else {
					test.log(msg);
				}
				self.connected();
			});
	});
};

test.BluetoothClient.prototype.start = function() {
	test.log('[' + this.socketId + '] Connected');

	var self = this;
	var socketId = this.socketId;
	chrome.bluetoothSocket.onReceive.addListener(function(receiveInfo) {
		if (receiveInfo.socketId != socketId) return;
		self.onReceive(receiveInfo);
	});
	chrome.bluetoothSocket.onReceiveError.addListener(function(errorInfo) {
		if (errorInfo.socketId != socketId) return;
		self.onReceiveError(errorInfo);
	});

	chrome.bluetoothSocket.setPaused(this.socketId, false,
		function() {
			if (test.failed()) return;
			self.connected();
		});
};

test.BluetoothClient.prototype.connected = function() {
	this.seqNum = 0;

	if (this.datamode == 'send' || this.datamode == 'ping')
		this.send();
};

test.BluetoothClient.prototype.send = function() {
	var data;
	if (this.datamode == 'send') {
		data = new ArrayBuffer(this.dataLen);
		len = this.dataLen;

		var bytes = new Uint8Array(data);

		// Sequence number as 32-bit Little Endian
		bytes[0] = this.seqNum & 0xff;
		bytes[1] = (this.seqNum >> 8) & 0xff;
		bytes[2] = (this.seqNum >> 16) & 0xff;
		bytes[3] = (this.seqNum >> 24) & 0xff;

		this.seqNum++;

		// Length of the packet as 16-bit Little Endian
		bytes[4] = this.dataLen & 0xff;
		bytes[5] = (this.dataLen >> 8) & 0xff;

		// Remaining should be 0x7f
		for (var i = 6; i < this.dataLen; ++i) {
			bytes[i] = 0x7f;
		}
	} else if (this.datamode == 'ping') {
		data = test.str2ab('ping');
	} else {
		return;
	}

	var self = this;
	chrome.bluetoothSocket.send(this.socketId, data,
		function(bytes_sent) {
			if (chrome.runtime.lastError) {
				test.error('[' + self.socketId + '] Send failed: ' +
					chrome.runtime.lastError.message);
				return;
			}

			test.log('[' + self.socketId + '] Wrote ' + bytes_sent + '/' +
				data.byteLength + ' bytes');
			if (self.datamode == 'send')
				self.send();
		});
};

test.BluetoothClient.prototype.onReceive = function(receiveInfo) {
	var bytes = new Uint8Array(receiveInfo.data);
	test.log('[' + this.socketId + '] Read ' +
		receiveInfo.data.byteLength + ' bytes');

	if (this.datamode == 'send') {
		this.verify(bytes);
	}
};

test.BluetoothClient.prototype.verify = function(bytes) {
	var pos = 0;

	while (pos < data.byteLength) {
		if ((data.byteLength - pos) < 6) {
			test.log('[' + this.socketId + '] Expected at least 6 bytes');
			break;
		}

		// Sequence number as 32-bit Little Endian
		var seqNum = 0;
		seqNum |= bytes[pos];
		seqNum |= bytes[pos+1] << 8;
		seqNum |= bytes[pos+2] << 8;
		seqNum |= bytes[pos+3] << 8;

		if (seqNum != this.seqNum) {
			test.log('[' + this.socketId + '] Sequence mismatch, expected ' +
				this.seqNum + ' got ' + seqNum);
			this.seqNum = seqNum;
		}

		this.seqNum++;

		// Length of the packet as 16-bit Little Endian
		var len = 0;
		len |= bytes[pos+4];
		len |= bytes[pos+5] << 8;

		if (pos + len > data.byteLength) {
			test.log('[' + this.socketId + '] Data longer than length, expected ' +
				(data.byteLength - pos) + ' got ' + len);
			break;
		}

		// Remaining should be 0x7f
		for (var i = 6; i < len; ++i) {
			if (bytes[pos+i] != 0x7f) {
				test.log('[' + this.socketId + '] Data mismatch at ' + i +
					', expected 0x7f got 0x' + bytes[pos+i].toString(16));
			}
		}
		pos += len;
	}
};

test.BluetoothClient.prototype.onReceiveError = function(errorInfo) {
	// TODO(keybuk): do something with the error
	// socket should be paused? close it?

	if (errorInfo.error == "disconnected") {
		test.log('[' + this.socketId + '] Disconnected by peer');
		chrome.bluetoothSocket.close(this.socketId);
		this.socketId = undefined;

		if (this.mode == 'reconnect') {
			var self = this;
			setTimeout(function() {
				self.connect();
			}, 200);
			return;
		}

		this.app.removeClient(this);
	} else {
		test.error('[' + this.socketId + '] Receive error: ' + errorInfo.errorMessage);
	}
};

test.BluetoothClient.prototype.disconnect = function() {
	var self = this;
	chrome.bluetoothSocket.disconnect(this.socketId, function() {
		if (chrome.runtime.lastError) {
			test.error('[' + self.socketId + '] Disconnect failed: ' +
				chrome.runtime.lastError.message);
		} else {
			test.log('[' + self.socketId + '] Disconnected');
		}

		chrome.bluetoothSocket.close(self.socketId);
		self.app.removeClient(self);
		self.socketId = undefined;
	});
};


window.onload = function() {
	test.logElement = document.getElementById('log');
	test.clearLog();

	test.Bluetooth.instance_ = new test.Bluetooth();
	test.log('Bluetooth Test loaded');

	document.getElementById('rfcomm').addEventListener('click',
		function() {
			document.getElementById('rfcomm_options').style.visibility = 'visible';
			document.getElementById('l2cap_options').style.visibility = 'hidden';
		});

	document.getElementById('l2cap').addEventListener('click',
		function() {
			document.getElementById('rfcomm_options').style.visibility = 'hidden';
			document.getElementById('l2cap_options').style.visibility = 'visible';
		});


	document.getElementById('start').addEventListener('click',
		function() {
			test.Bluetooth.instance_.start();
		});

	document.getElementById('discovery').addEventListener('click',
		function() {
			test.Bluetooth.instance_.startDiscovery();
		});

	document.getElementById('clear').addEventListener('click',
		function() {
			test.clearLog();
		})
};
