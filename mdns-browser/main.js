
/**
 * Construct a new ServiceFinder. This is a single-use object that does a DNS
 * multicast search on creation.
 * @constructor
 * @param {function} callback The callback to be invoked when this object is
 *                            updated, or when an error occurs (passes string).
 */
var ServiceFinder = function(callback) {
  var me = this;
  this.callback_ = callback;
  this.pendingCallback_ = false;
  this.active_ = true;
  this.byIP_ = {};
  this.byService_ = {};
  this.socket_ = chrome.experimental.socket || chrome.socket;

  this.socket_.create('udp', {}, function(createInfo) {
    me.sock_ = createInfo['socketId'];

    // NOTE: This will only search for entries on the first/default network
    // interface.
    me.socket_.bind(me.sock_, '0.0.0.0', 0, function(result) {
      if (result) {
        return me.done_('could not bind socket: ' + result);
      }
      me.recv_.apply(me);
      me.broadcast.apply(me);
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
ServiceFinder.prototype.recv_ = function(info) {
  this.socket_.recvFrom(this.sock_, this.recv_.bind(this));
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
ServiceFinder.prototype.broadcast = function(done) {
  var packet = new DNSPacket();
  packet.push('qd', new DNSRecord('_services._dns-sd._udp.local', 12, 1));

  var raw = packet.serialize();
  this.socket_.sendTo(this.sock_, raw, '224.0.0.251', 5353,
      function(writeInfo) {
    if (writeInfo.bytesWritten != raw.byteLength) {
      this.fail_('could not write DNS packet: ' + raw);
    }
  });

  // After five seconds, if we haven't seen anyone, we're unlikely to.
  setTimeout(this.callback_, 5000);
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
    finder = new ServiceFinder(callback_);
    // TODO: Make the working indicator a spinner, and start it up here.
  });
});

