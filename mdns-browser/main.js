
/**
 * Construct a new ServiceFinder. This is a single-use object that does a DNS
 * multicast search on creation.
 * @constructor
 * @param {function} callback The callback to be invoked when this object is
 *                            updated, or when an error occurs (passes string).
 */
var ServiceFinder = function(callback) {
  this.callback_ = callback;
  this.byIP_ = {};
  this.byService_ = {};
  this.sockets_ = [];

  ServiceFinder.forEachAddress_(function(address) {
    if (address.indexOf(':') != -1) {
      // TODO: ipv6.
      console.log('IPv6 address unsupported', address);
      return true;
    }
    console.log('Broadcasting to address', address);

    ServiceFinder.bindToAddress_(address, function(socket) {
      if (chrome.runtime.lastError) {
        this.callback_('could not bind UDP socket: ' +
            chrome.runtime.lastError.message);
        return true;
      }

      // Store the socket, set up a recieve handler, and broadcast on it.
      this.sockets_.push(socket);
      this.recv_(socket);
      this.broadcast_(socket, address);
    }.bind(this));
  }.bind(this));

  // After a short time, if our database is empty, report an error.
  setTimeout(function() {
    if (!Object.keys(this.byIP_).length) {
      this.callback_('no mDNS services found!');
    }
  }.bind(this), 10 * 1000);
};

ServiceFinder.api = chrome.socket || chrome.experimental.socket;

/**
 * Invokes the callback for every local network address on the system.
 * @private
 * @param {function} callback to invoke
 */
ServiceFinder.forEachAddress_ = function(callback) {
  var api = ServiceFinder.api;

  if (!api.getNetworkList) {
    // Short-circuit for Chrome built before r155662.
    callback('0.0.0.0', '*');
    return true;
  }

  api.getNetworkList(function(adapterInfo) {
    adapterInfo.forEach(function(info) {
      callback(info['address'], info['name']);
    });
  });
};

/**
 * Creates UDP socket bound to the specified address, passing it to the
 * callback. Passes null on failure.
 * @private
 * @param {string} address to bind to
 * @param {function} callback to invoke when done
 */
ServiceFinder.bindToAddress_ = function(address, callback) {
  var api = ServiceFinder.api;

  api.create('udp', {}, function(createInfo) {
    api.bind(createInfo['socketId'], address, 0, function(result) {
      callback(createInfo['socketId']);
    });
  });
};

/**
 * Sorts the passed list of string IPs in-place.
 * @private
 */
ServiceFinder.sortIps_ = function(arg) {
  arg.sort(ServiceFinder.sortIps_.sort);
  return arg;
};
ServiceFinder.sortIps_.sort = function(l, r) {
  // TODO: support v6.
  var lp = l.split('.').map(ServiceFinder.sortIps_.toInt_);
  var rp = r.split('.').map(ServiceFinder.sortIps_.toInt_);
  for (var i = 0; i < Math.min(lp.length, rp.length); ++i) {
    if (lp[i] < rp[i]) {
      return -1;
    } else if (lp[i] > rp[i]) {
      return +1;
    }
  }
  return 0;
};
ServiceFinder.sortIps_.toInt_ = function(i) { return +i };

/**
 * Returns the services found by this ServiceFinder, optionally filtered by IP.
 */
ServiceFinder.prototype.services = function(opt_ip) {
  var k = Object.keys(opt_ip ? this.byIP_[opt_ip] : this.byService_);
  k.sort();
  return k;
};

/**
 * Returns the IPs found by this ServiceFinder, optionally filtered by service.
 */
ServiceFinder.prototype.ips = function(opt_service) {
  var k = Object.keys(opt_service ? this.byService_[opt_service] : this.byIP_);
  return ServiceFinder.sortIps_(k);
};

/**
 * Handles an incoming UDP packet.
 * @private
 */
ServiceFinder.prototype.recv_ = function(sock, info) {
  if (chrome.runtime.lastError) {
    // If our socket fails, detect this early: otherwise we'll just register
    // to receive again (and fail again).
    this.callback_(chrome.runtime.lastError.message);
    return true;
  }
  ServiceFinder.api.recvFrom(sock, this.recv_.bind(this, sock));
  if (!info) {
    // We didn't receive any data, we were just setting up recvFrom.
    return false;
  }

  var getDefault_ = function(o, k, def) {
    (k in o) || false == (o[k] = def);
    return o[k];
  };

  // Update our local database.
  // TODO: Resolve IPs using the dns extension.
  var packet = DNSPacket.parse(info.data);
  var byIP = getDefault_(this.byIP_, info.address, {});

  packet.each('an', 12, function(rec) {
    var ptr = rec.asName();
    var byService = getDefault_(this.byService_, ptr, {})
    byService[info.address] = true;
    byIP[ptr] = true;
  }.bind(this));

  // Ping! Something new is here. Only update every 25ms.
  if (!this.callback_pending_) {
    this.callback_pending_ = true;
    setTimeout(function() {
      this.callback_pending_ = undefined;
      this.callback_();
    }.bind(this), 25);
  }
};

/**
 * Broadcasts for services on the given socket/address.
 * @private
 */
ServiceFinder.prototype.broadcast_ = function(sock, address) {
  var packet = new DNSPacket();
  packet.push('qd', new DNSRecord('_services._dns-sd._udp.local', 12, 1));

  var raw = packet.serialize();
  ServiceFinder.api.sendTo(sock, raw, '224.0.0.251', 5353, function(writeInfo) {
    if (writeInfo.bytesWritten != raw.byteLength) {
      this.callback_('could not write DNS packet on: ' + address);
    }
  });
};

ServiceFinder.prototype.shutdown = function() {
  this.sockets_.forEach(function(sock) {
    ServiceFinder.api.disconnect(sock);
    ServiceFinder.api.destroy(sock);
  });
}

window.addEventListener('load', function() {
  var results = document.getElementById('results');
  var serviceDb = {
    '_workstation._tcp': 'Workgroup Manager',
    '_ssh._tcp': 'SSH',
    '_daap._tcp': 'iTunes',
    '_airplay': 'AirPlay',
    '_afpovertcp': 'AFP (Apple Filing Protocol)',
    '_raop': 'AirTunes',
  };

  var getHtml_ = function(category, key) {
    if (category == finder.services && key in serviceDb) {
      return key + ' <em>' + serviceDb[key] + '</em>';
    }
    return key;
  };

  var finder;
  var mode = 'service';
  var callback_ = function(opt_error) {
    results.innerHTML = '';
    results.classList.remove('working');

    if (opt_error) {
      var s = document.createElement('strong');
      s.classList.add('warning');
      s.innerText = opt_error;
      results.appendChild(s);
      return console.warn(opt_error);
    }

    var outer = finder.services;
    var inner = finder.ips;
    if (mode == 'ip') {
      outer = finder.ips;
      inner = finder.services;
    }
    // TODO: render information about outer/inner
    // for IPs, render 'last seen at...'
    // for services, render known service type.

    results.innerHTML = '';
    outer.apply(finder).forEach(function(o) {
      var li = document.createElement('li');
      li.innerHTML = getHtml_(outer, o);
      results.appendChild(li);

      var ul = document.createElement('ul');
      inner.call(finder, o).forEach(function(i) {
        var li = document.createElement('li');
        li.innerHTML = getHtml_(inner, i);
        ul.appendChild(li);
      });
      ul.childNodes.length && results.appendChild(ul);
    });
  };

  // Configure the refresh button, then immediately invoke it.
  var refreshBtn = document.getElementById('btn-refresh');
  refreshBtn.addEventListener('click', function() {
    results.innerHTML = '';
    results.classList.add('working');

    finder && finder.shutdown();
    finder = new ServiceFinder(callback_);
  });
  refreshBtn.click();

  // Configure the mode button, then immediately invoke it twice to reset to
  // the default state (show by service).
  var modeBtn = document.getElementById('btn-mode');
  modeBtn.addEventListener('click', function() {
    var h = document.getElementById('mode-span');
    if (mode == 'service') {
      mode = 'ip';
      h.innerText = 'IP';
    } else {
      mode = 'service';
      h.innerText = 'Service';
    }
    if (finder) {
      callback_();
    }
  });
  modeBtn.click(); modeBtn.click();

  // Configure the close button.
  document.getElementById('btn-close').addEventListener('click', function() {
    window.close();
  });
});

