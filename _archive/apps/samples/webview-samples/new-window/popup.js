var popup = (function(configModule) {
  var dce = function(str) { return document.createElement(str); };

  var cfg = configModule.popupConfirmBox;
  var popupBoxTemplate = dce('li');
  popupBoxTemplate.innerHTML = cfg.innerHTML;

  var PopupConfirmBoxList = function(listElement) {
    this.listElement = listElement;
    this.list = [];
  };

  PopupConfirmBoxList.prototype.getListElement = function() {
    return this.listElement;
  };

  PopupConfirmBoxList.prototype.append = function(event) {
    var box = new PopupConfirmBox(this, event);
    this.list.push(box);
    this.listElement.appendChild(box.getBoxElement());
  };

  PopupConfirmBoxList.prototype.removeBox = function(box) {
    for (var i = 0; i < this.list.length; ++i) {
      if (this.list[i] == box) {
        this.listElement.removeChild(box.getBoxElement());
        this.list.splice(i, 1);
        break;
      }
    }
  };

  var PopupConfirmBox = function(popupList, event) {
    this.popupList = popupList;
    this.event = event;
    this.url = event.targetUrl;
    this.boxElement = popupBoxTemplate.cloneNode(true);
    this.initBoxElement();
  };

  PopupConfirmBox.prototype.initBoxElement = function() {
    var urlSpan = this.boxElement.querySelector('.' + cfg.urlSpanClass);
    var acceptLink = this.boxElement.querySelector('.' + cfg.acceptLinkClass);
    var denyLink = this.boxElement.querySelector('.' + cfg.denyLinkClass);

    urlSpan.innerText = this.url;

    (function(box) {
      acceptLink.addEventListener('click', function(e) { box.doAccept(); });
      denyLink.addEventListener('click', function(e) { box.doDeny(); });
    }(this));
  };

  PopupConfirmBox.prototype.getBoxElement = function() {
    return this.boxElement;
  };

  PopupConfirmBox.prototype.doAccept = function() {
    (function(box) {
      // TODO: Inspect box.event for window.open()'s name and attributes to
      // correctly manage:
      // 1. Multiple popups in the same window (i.e., window.open() twice with
      //    the same window name)
      // 2. Set attributes of popup window (e.g., size, location)
      chrome.app.window.create(
          'browser.html',
          function(newWindow) {
            // Pass new window event through global: window.newWindowEvent.
            // NOTE: Webview creation and box.event.window.attach(webview)
            // cannot be performed in this context; that has to happen in the
            // context of the new window.
            newWindow.contentWindow.newWindowEvent = box.event;
          });
    }(this));

    this.popupList.removeBox(this);
    this.detach();
  };

  PopupConfirmBox.prototype.doDeny = function() {
    this.event.window.discard();

    this.popupList.removeBox(this);
    this.detach();
  };

  PopupConfirmBox.prototype.detach = function() {
    this.popupList = null;
  };

  return {
    'PopupConfirmBoxList': PopupConfirmBoxList,
    'PopupConfirmBox': PopupConfirmBox
  };
}(config));
