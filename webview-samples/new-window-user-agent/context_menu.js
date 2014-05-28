var contextMenu = (function() {
  var ContextMenu = function(webview, popupConfirmBoxList) {
    this.webview = webview;
    this.popupConfirmBoxList = popupConfirmBoxList;
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
        'id': 'newTabDefault',
        'title': 'Default browser',
        'contexts': ['link'],
        'parentId': 'newTab',
        'onclick': function(e) { menu.doNewTab(e); }
      });
    }(this));
  };

  ContextMenu.prototype.doNewWindow = function(e, browser) {
    var url = e.linkUrl;
    var id = this.getId();
    var features = this.getWindowFeatures();
    var code = 'window.open("' + url + '", "' + id + '", "' + features + '");';
    this.popupConfirmBoxList.allowOnce(url);
    this.doWindowOpen(code);
  };

  ContextMenu.prototype.doNewTab = function(e, browser) {
    var url = e.linkUrl;
    var code = 'window.open("' + url + '");';
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

  return {'ContextMenu': ContextMenu};
}());
