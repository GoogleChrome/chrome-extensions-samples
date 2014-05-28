var contextMenu = (function(configModule) {
  var ContextMenu = function(webview, popupConfirmBoxList) {
    this.webview = webview;
    this.popupConfirmBoxList = popupConfirmBoxList;
    this.oneTimeUserAgentTable = {};

    (function(menu) {
      menu.webview.contextMenus.create({
        'id': 'newWindow',
        'title': 'Open link in new window as...',
        'contexts': ['link']
      });
      menu.webview.contextMenus.create({
        'id': 'newTab',
        'title': 'Open link in new tab as...',
        'contexts': ['link']
      });

      menu.webview.contextMenus.create({
        'id': 'newWindowDefault',
        'title': 'Default browser',
        'contexts': ['link'],
        'parentId': 'newWindow',
        'onclick': function(e) { menu.doNewWindow(e); }
      });
      menu.webview.contextMenus.create({
        'type': 'separator',
        'parentId': 'newWindow'
      });
      menu.webview.contextMenus.create({
        'id': 'newWindowAndroid',
        'title': 'Android',
        'contexts': ['link'],
        'parentId': 'newWindow',
        'onclick': function(e) { menu.doNewWindow(e, 'android'); }
      });

      menu.webview.contextMenus.create({
        'type': 'separator'
      });

      menu.webview.contextMenus.create({
        'id': 'newTabDefault',
        'title': 'Default browser',
        'contexts': ['link'],
        'parentId': 'newTab',
        'onclick': function(e) { menu.doNewTab(e); }
      });
      menu.webview.contextMenus.create({
        'type': 'separator',
        'parentId': 'newTab'
      });
      menu.webview.contextMenus.create({
        'type': 'separator',
        'parentId': 'newTab'
      });
      menu.webview.contextMenus.create({
        'id': 'newTabAndroid',
        'title': 'Android',
        'contexts': ['link'],
        'parentId': 'newTab',
        'onclick': function(e) { menu.doNewTab(e, 'android'); }
      });
    }(this));
  };

  ContextMenu.prototype.doNewWindow = function(e, browser) {
    var url = e.linkUrl;
    var id = this.getId();
    var features = this.getWindowFeatures();
    var code = 'window.open("' + url + '", "' + id + '", "' + features + '");';
    this.loadOnce(url, browser);
    this.doWindowOpen(code);
  };

  ContextMenu.prototype.doNewTab = function(e, browser) {
    var url = e.linkUrl;
    var code = 'window.open("' + url + '");';
    this.loadOnce(url, browser);
    this.doWindowOpen(code);
  };

  ContextMenu.prototype.doWindowOpen = function(code) {
    (function(menu) {
      menu.webview.executeScript(
          {'code': code},
          function(results) {
            if (!results || !results.length) {
              console.warn(
                  'Warning: Failed to inject window.open script',
                  menu.webview);
            }
          });
    }(this));
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
