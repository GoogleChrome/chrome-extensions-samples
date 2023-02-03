var contextMenu = (function(configModule) {
  var ContextMenu = function(webview, popupConfirmBoxList) {
    this.webview = webview;
    this.popupConfirmBoxList = popupConfirmBoxList;
    this.oneTimeUserAgentTable = {};

    (function(menu) {
      menu.webview.contextMenus.create({
        'contexts': ['link'],
        'id': 'newWindow',
        'title': 'Open link in new window as...'
      });
      menu.webview.contextMenus.create({
        'contexts': ['link'],
        'id': 'newTab',
        'title': 'Open link in new tab as...'
      });

      menu.webview.contextMenus.create({
        'contexts': ['link'],
        'id': 'newWindowDefault',
        'title': 'Default browser',
        'parentId': 'newWindow',
        'onclick': function(e) { menu.doNewWindow(e); }
      });
      menu.webview.contextMenus.create({
        'contexts': ['link'],
        'type': 'separator',
        'parentId': 'newWindow'
      });
      menu.webview.contextMenus.create({
        'contexts': ['link'],
        'id': 'newTabDefault',
        'title': 'Default browser',
        'parentId': 'newTab',
        'onclick': function(e) { menu.doNewTab(e); }
      });
      menu.webview.contextMenus.create({
        'contexts': ['link'],
        'type': 'separator',
        'parentId': 'newTab'
      });
      menu.webview.contextMenus.create({
        'type': 'separator',
        'parentId': 'newTab'
      });

      for (var key in configModule.browsers) {
        (function(key, browserName) {
          menu.webview.contextMenus.create({
            'contexts': ['link'],
            'id': 'newWindow_' + key,
            'title': browserName,
            'parentId': 'newWindow',
            'onclick': function(e) { menu.doNewWindow(e, key); }
          });
          menu.webview.contextMenus.create({
            'contexts': ['link'],
            'id': 'newTab_' + key,
            'title': browserName,
            'parentId': 'newTab',
            'onclick': function(e) { menu.doNewTab(e, key); }
          });
        }(key, configModule.browsers[key]));
      }
    }(this));
  };

  ContextMenu.prototype.doNewWindow = function(e, browser) {
    var url = e.linkUrl;
    this.loadOnce(url, browser);
    this.doWindowOpen(url);
  };

  ContextMenu.prototype.doNewTab = function(e, browser) {
    var url = e.linkUrl;
    var code = 'window.simulateMiddleClickUrl = ';
    console.log(code);
    this.loadOnce(url, browser);
    this.doTabOpen(url);
  };

  ContextMenu.prototype.doWindowOpen = function(url) {
    var data = {
      'type': 'simulatePopup',
      'url': url
    };
    this.webview.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  ContextMenu.prototype.doTabOpen = function(url) {
    var data = {
      'type': 'simulateCtrlClick',
      'url': url
    };
    this.webview.contentWindow.postMessage(JSON.stringify(data), '*');
  };

  ContextMenu.prototype.getId = function() {
    return 'id-' + (new Date()).getTime();
  };

  ContextMenu.prototype.getWindowFeatures = function() {
    return 'width=100,height=100,left=100,top=100';
  };

  ContextMenu.prototype.loadOnce = function(url, browser) {
    var userAgent = configModule.browserUserAgents[browser];
    // Unconditionally store URL in table so that existence in table is an
    // indicator that we are loading this URL
    this.oneTimeUserAgentTable[url] = userAgent;
  };

  ContextMenu.prototype.doOpen = function(url, webview) {
    var userAgent = this.oneTimeUserAgentTable[url];
    if (webview && userAgent) {
      webview.setUserAgentOverride(this.oneTimeUserAgentTable[url]);
    }
    delete this.oneTimeUserAgentTable[url];
  };

  ContextMenu.prototype.getUserAgentOverride = function(url) {
    return this.oneTimeUserAgentTable[url];
  };

  ContextMenu.prototype.isOpening = function(url) {
    // Existence in oneTimeUserAgentTable is an indicator for opening a URL
    return (url in this.oneTimeUserAgentTable);
  };

  return {'ContextMenu': ContextMenu};
}(config));
