// All the counters.
Counter.all = [];

function Counter(id, clicks, startedBy) {
  this.id = id;
  this.clicks = clicks;
  this.startedBy = startedBy;
  this.saving = false;
  this.listeners = [];
  this.save();
  Counter.all.push(this);
}

Counter.prototype.attachToWindow = function(win, document) {
  win.onClosed.addListener(this.close.bind(this));

  var self = this;
  document.getElementById('started-by').innerText = this.startedBy;
  this.addListener(function(clicks) {
    document.getElementById('number').innerText = clicks;
  });

  document.getElementById('clickButton').addEventListener('click', function(e) {
    self.increment();
  }, false);

  document.getElementById('logLocalStorage').addEventListener('click', function(e) {
    logLocalStorage();
  }, false);
};

Counter.prototype.addListener = function(l) {
  this.listeners.push(l);
  this.notifyClickCount();
};

Counter.prototype.clearListeners = function() {
  this.listeners = [];
};

Counter.prototype.notifyClickCount = function() {
  for (var i = 0; i < this.listeners.length; i++) {
    this.listeners[i](this.clicks);
  }
};

Counter.prototype.increment = function() {
  this.clicks++;
  this.notifyClickCount();
  this.save();
};

Counter.prototype.save = function() {
  if (this.saving)
    return;

  this.saving = true;

  var self = this;
  (function(clicks) {
    var counters = {};
    counters[self.id] = {'clicks': clicks};
    var data = {'counters': counters};
    chrome.storage.local.get('counters', function(data) {
      if (!data.counters) {
        data.counters = {};
      }
      data.counters[self.id] = {'clicks': clicks};
      chrome.storage.local.set(data, function() {
        self.saving = false;
        if (self.clicks != clicks) {
          // self.clicks changed while we were saving, so save again.
          self.save();
        }
      });
    });
  })(this.clicks);
};

Counter.prototype.close = function() {
  this.clearListeners();
  var self = this;
  chrome.storage.local.get('counters', function(data) {
    delete data.counters[self.id];
    chrome.storage.local.set(data);
  });

  // Remove self from global list.
  var i = Counter.all.indexOf(this);
  if (i != -1)
    Counter.splice(i, 1);
};

function runApp(counter) {
  chrome.app.window.create('main.html', {
    id: counter.id + '',
    innerBounds: {
      width: 800,
      height: 600
    }
  }, function(win) {
    win.contentWindow.onload = function() {
      counter.attachToWindow(win, win.contentWindow.document);
    };
  });
}

chrome.app.runtime.onLaunched.addListener(function() {
  if (Counter.all.length == 0) {
    // We might have left over state from a previous hard shutdown.
    chrome.storage.local.clear();
  }
  chrome.storage.local.get('nextId', function(data) {
    if (!data.nextId)
      data.nextId = 0;
    var id = data.nextId++;
    var counter = new Counter(id, 0, 'launched');
    runApp(counter);
    chrome.storage.local.set(data);
  });
});

chrome.app.runtime.onRestarted.addListener(function() {
  chrome.storage.local.get(null, function(data) {
    for (var id in data.counters) {
      var clicks = data.counters[id].clicks;
      var counter = new Counter(id, clicks, 'restarted');
      runApp(counter);
    }
  });
});

function logLocalStorage() {
  chrome.storage.local.get(null, function(data) {
    console.log("local storage:", data);
  });
}
