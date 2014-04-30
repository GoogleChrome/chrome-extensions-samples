
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

  // Set up receive handlers.
  this.onReceiveListener_ = this.onReceive_.bind(this);
  chrome.sockets.udp.onReceive.addListener(this.onReceiveListener_);
  this.onReceiveErrorListener_ = this.onReceiveError_.bind(this);
  chrome.sockets.udp.onReceiveError.addListener(this.onReceiveErrorListener_);

  ServiceFinder.forEachAddress_(function(address, error) {
    if (error) {
      this.callback_(error);
      return true;
    }
    if (address.indexOf(':') != -1) {
      // TODO: ipv6.
      console.log('IPv6 address unsupported', address);
      return true;
    }
    console.log('Broadcasting to address', address);

    ServiceFinder.bindToAddress_(address, function(socket) {
      if (!socket) {
        this.callback_('could not bind UDP socket');
        return true;
      }
      // Broadcast on it.
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

/**
 * Invokes the callback for every local network address on the system.
 * @private
 * @param {function} callback to invoke
 */
ServiceFinder.forEachAddress_ = function(callback) {
  chrome.system.network.getNetworkInterfaces(function(networkInterfaces) {
    if (!networkInterfaces.length) {
      callback(null, 'no network available!');
      return true;
    }
    networkInterfaces.forEach(function(networkInterface) {
      callback(networkInterface['address'], null);
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
  chrome.sockets.udp.create({}, function(createInfo) {
    chrome.sockets.udp.bind(createInfo['socketId'], address, 0,
        function(result) {
      callback((result >= 0) ? createInfo['socketId'] : null);
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
ServiceFinder.prototype.onReceive_ = function(info) {
  var getDefault_ = function(o, k, def) {
    (k in o) || false == (o[k] = def);
    return o[k];
  };

  // Update our local database.
  // TODO: Resolve IPs using the dns extension.
  var packet = DNSPacket.parse(info.data);
  var byIP = getDefault_(this.byIP_, info.remoteAddress, {});

  packet.each('an', 12, function(rec) {
    var ptr = rec.asName();
    var byService = getDefault_(this.byService_, ptr, {})
    byService[info.remoteAddress] = true;
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
 * Handles network error occured while waiting for data.
 * @private
 */
ServiceFinder.prototype.onReceiveError_ = function(info) {
  this.callback_(info.resultCode);
  return true;
}

/**
 * Broadcasts for services on the given socket/address.
 * @private
 */
ServiceFinder.prototype.broadcast_ = function(sock, address) {
  var packet = new DNSPacket();
  packet.push('qd', new DNSRecord('_services._dns-sd._udp.local', 12, 1));

  var raw = packet.serialize();
  chrome.sockets.udp.send(sock, raw, '224.0.0.251', 5353, function(sendInfo) {
    if (sendInfo.resultCode < 0)
      this.callback_('Could not send data to:' + address);
  });
};

ServiceFinder.prototype.shutdown = function() {
  // Remove event listeners.
  chrome.sockets.udp.onReceive.removeListener(this.onReceiveListener_);
  chrome.sockets.udp.onReceiveError.removeListener(this.onReceiveErrorListener_);
  // Close opened sockets.
  chrome.sockets.udp.getSockets(function(sockets) {
    sockets.forEach(function(sock) {
      chrome.sockets.udp.close(sock.socketId);
    });
  });
}

window.addEventListener('load', function() {
  var results = document.getElementById('results');

  var getHtml_ = function(category, key) {
    if (category == finder.services && key in serviceTypes) {
      return key + ' <em>' + serviceTypes[key] + '</em>';
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

