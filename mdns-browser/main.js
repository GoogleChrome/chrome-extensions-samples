
/**
 * Construct a new ServiceFinder. This is a single-use object that does a DNS
 * multicast search on creation.
 * @constructor
 * @param {function} callback The callback to be invoked when this object is
 *                            updated, or when an error occurs (passes string).
 */
var ServiceFinder = function(callback) {
  this.callback_ = callback;
  this.pendingCallback_ = false;
  this.active_ = true;
  this.byIP_ = {};
  this.byService_ = {};
  this.sock_ = [];
  this.socket_ = [];

  ServiceFinder.forEachAddress_(function(address) {
    if (address.indexOf(':') != -1) {
      // TODO: ipv6.
      console.log('IPv6 address unsupported', address);
      return true;
    }
    console.log('Broadcasting to address', address);

    ServiceFinder.bindToAddress_(address, function(socket) {
      if (!socket) {
        return false;
      }

      // Store the socket, set up a recieve handler, and broadcast on it.
      this.socket_.push(socket);
      this.recv_(socket);
      this.broadcast(socket);
    }.bind(this));
  }.bind(this));
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
      if (result) {
        console.warn('could not bind udp socket', address);
        callback(null);
      } else {
        callback(createInfo['socketId']);
      }
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

ServiceFinder.prototype.services = function(opt_ip) {
  var k = Object.keys(opt_ip ? this.byIP_[opt_ip] : this.byService_);
  k.sort();
  return k;
};

ServiceFinder.prototype.ips = function(opt_service) {
  var k = Object.keys(opt_service ? this.byService_[opt_service] : this.byIP_);
  return ServiceFinder.sortIps_(k);
};

/**
 * @private
 */
ServiceFinder.prototype.done_ = function(opt_error) {
  this.active_ = false;
  this.callback_(opt_error);
};

/**
 * Handles an incoming UDP packet.
 * @private
 */
ServiceFinder.prototype.recv_ = function(sock, info) {
  ServiceFinder.api.recvFrom(sock, this.recv_.bind(this, sock));
  if (!info) {
    console.info('no data on socket', sock);
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
  if (!this.pendingCallback_) {
    this.pendingCallback_ = true;
    setTimeout(function() {
      this.pendingCallback_ = false;
      this.callback_();
    }.bind(this), 25);
  }
};

/**
 * Broadcasts for services. Hi, everybody!
 */
ServiceFinder.prototype.broadcast = function(opt_sock) {
  if (!opt_sock) {
    this.socket_.forEach(this.broadcast);

    // After five seconds, if we haven't seen anyone, we're unlikely to.
    setTimeout(this.callback_, 5000);
    return;
  }
  
  var packet = new DNSPacket();
  packet.push('qd', new DNSRecord('_services._dns-sd._udp.local', 12, 1));

  var raw = packet.serialize();
  ServiceFinder.api.sendTo(opt_sock, raw, '224.0.0.251', 5353,
      function(writeInfo) {
    if (writeInfo.bytesWritten != raw.byteLength) {
      this.fail_('could not write DNS packet: ' + raw);
    }
  });
};

window.addEventListener('load', function() {
  var results = document.getElementById('results');
  var serviceDb = {
    '_workstation._tcp': 'Workgroup Manager',
    '_ssh._tcp': 'SSH',
    '_daap._tcp': 'iTunes',
  };
  var refreshBtn = document.getElementById('refresh');
  refreshBtn.origText = refreshBtn.innerHTML;
  refreshBtn.innerHTML = '&hellip;';
  var modeBtn = document.getElementById('mode');

  var getHtml_ = function(category, key) {
    if (category == finder.services && key in serviceDb) {
      return key + ' <em>' + serviceDb[key] + '</em>';
    }
    return key;
  };

  var finder;
  var mode = 'service';
  var callback_ = function(opt_error) {
    refreshBtn.innerHTML = refreshBtn.origText;
    if (opt_error) {
      return console.warn('error', opt_error);
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
  finder = new ServiceFinder(callback_);

  refreshBtn.addEventListener('click', function() {
    refreshBtn.innerHTML = '&hellip;';
    finder.broadcast();
  });
  modeBtn.addEventListener('click', function() {
    var h = document.getElementById('mode-span');
    if (mode == 'service') {
      mode = 'ip';
      h.innerText = 'IP';
    } else {
      mode = 'service';
      h.innerText = 'Service';
    }
    callback_();
  });
  modeBtn.click(); modeBtn.click();

  document.getElementById('clear-refresh').addEventListener('click',
      function() {
    // TODO: Destroy all old sockets. If we do this however, socket.recvFrom
    // spews logs for any incoming message to the old socket (perhaps we can do
    // this better).
    finder = new ServiceFinder(callback_);
    // TODO: Make the working indicator a spinner, and start it up here.
  });
});

