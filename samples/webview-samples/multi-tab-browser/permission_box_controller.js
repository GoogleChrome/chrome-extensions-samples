var permissionTool = (function() {
  var containerElement = null;
  var browserInstance = null;
  var controller = null;
  var allow = null, deny = null;
  var hostRecords = [];

  function query(id) { return containerElement.querySelector(id);}

  function HostPermissions(host) {
    this.host = host;
    this.permissions = [];
  }

  function getHostForURL(url) {
    var l = document.createElement('a');
    l.href = url;
    return l.hostname;
  }

  function getHostEntry(host) {
    for (var index = 0; index < hostRecords.length; ++index) {
      if (hostRecords[index].host === host) {
        return hostRecords[index];
      }
    }
    return null;
  }

  function check(host, permission) {
    var entry = getHostEntry(host);
    if (entry) {
      if (entry.permissions[permission]) {
        return entry.permissions[permission];
      }
    }
    return null;
  };


  function addEntry(host, permission, value) {
    var entry = getHostEntry(host);
    if (!entry) {
      entry = new HostPermissions(host);
      hostRecords.push(entry);
    }
    entry.permissions[permission] = value;
  };

  var PermissionController = function(container, browser) {
    containerElement = container;
    browserInstance = browser;
    controller = this;

    query('#allow').onclick = onAllow;
    query('#deny').onclick = onDeny;
    container.className = 'overlay-bar';
  };

  PermissionController.prototype.ifPermits =
      function(url, permission, callback) {        
        var result = check(url, permission);
        if (!result) {
          containerElement.style.display = 'inline-block';
          containerElement.querySelector('#question').innerHTML =
              'The page at "' + url + '" is asking for permission to use <b>'
              + permission + '</b>. What would you like to do?';
          this.urlReq = url;
          this.callbackReq = callback;
          this.permissionReq = permission;
          containerElement.style.display = 'block';
        } else {
          callback(result);
        }
      };

  PermissionController.prototype.deactivate = function() {
    deactivate();
  };

  function onAllow() {
    deactivate();
    addEntry(controller.urlReq, controller.permissionReq, 'ALLOW');
    controller.callbackReq('ALLOW');
  }

  function onDeny() {
    deactivate();
    addEntry(controller.urlReq, controller.permissionReq, 'DENY');
    controller.callbackReq('DENY');
  }

  function deactivate() {
    containerElement.style.display = 'none';
  };

  return {'PermissionController': PermissionController};

})();
