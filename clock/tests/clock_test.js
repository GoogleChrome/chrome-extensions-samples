chrome = {};
chrome.storage = {};
chrome.storage.sync = {};
storage_get_called = false;
storage_set_called = false;

chrome.storage.sync.get = function() {
  storage_get_called = true;
}

chrome.storage.sync.set = function(items) {
  storage_set_called = true;
  storage_items = items;
}

var Context = new Class({
  initialize: function($canvasElem) {
    this._ctx = $canvasElem._.getContext('2d');

    this._calls = []; // names/args of recorded calls

    this._initMethods();
  },
  _initMethods: function() {
    // define methods to test here
    // no way to introspect so we have to do some extra work :(
    var methods = {
      fill: function() {
        this._ctx.fill();
      },
      lineTo: function(x, y) {
        this._ctx.lineTo(x, y);
      },
      moveTo: function(x, y) {
        this._ctx.moveTo(x, y);
      },
      stroke: function() {
        this._ctx.stroke();
      }
      // and so on
    };

    // attach methods to the class itself
    var scope = this;
    var addMethod = function(name, method) {
      scope[methodName] = function() {
        scope.record(name, arguments);
        method.apply(scope, arguments);
      };
    }

    for(var methodName in methods) {
      var method = methods[methodName];
      addMethod(methodName, method);
    }
  },
  assign: function(k, v) {
    this._ctx[k] = v;
  },
  record: function(methodName, args) {
    this._calls.push({name: methodName, args: args});
  },
  getCalls: function() {
    return this._calls;
  }
  // TODO: expand API as needed
});


$(document).ready(function() {

  module("Initialization");

    test("Get Chrome Storage", function() {
      expect(1);
      ok(storage_get_called);
    });

  module("Clock");


});

















