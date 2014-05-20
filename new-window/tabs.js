var tabs = (function() {
  var dce = function(str) { return document.createElement(str); };

  function TabList(name, browser, tabContainer, contentContainer) {
    this.name = name;
    this.list = [];
    this.table = {};
    this.selected = 0;
    this.browser = browser;
    this.tabContainer = tabContainer;
    this.contentContainer = contentContainer;
  };

  TabList.prototype.selectIdx = function(idx) {
    this.selectTab(this.list[idx], idx);
  };

  TabList.prototype.selectTab = function(tab, idx) {
    var prevTab = this.list[this.selected];
    prevTab.deselect();

    if (!(idx === 0 || idx)) {
      for (var i = 0; i < this.list.length; ++i) {
        if (this.list[i] == tab) {
          idx = i;
          break;
        }
      }
    }
    this.selected = idx;

    this.browser.doLayout();
    this.browser.doTabSwitch(prevTab, tab);
      tab.select();
  };

  TabList.prototype.append = function(webview) {
    var tabName = this.name + '-' + this.list.length;
    var tab = new Tab(tabName, this, webview);

    this.list.push(tab);
    this.table[tabName] = tab;
    this.tabContainer.appendChild(tab.labelContainer);
    this.contentContainer.appendChild(tab.webview);
  };

  TabList.prototype.removeTab = function(tab, idx) {
    if (this.list.length > 1) {
      if (tab.selected == true) {
        this.selectIdx((this.selected + 1) % this.list.length);
      }

      this.tabContainer.removeChild(tab.label);
      this.contentContainer.removeChild(tab.webview);

      tab.detatch();
      delete this.table[tab.name];
      if (idx === 0 || idx) {
        this.list.splice(idx, 1);
      } else {
        for (var i = 0; i < this.list.length; ++i) {
          if (this.list[i] == tab) {
            this.list.splice(i, 1);
            break;
          }
        }
      }
    }
  };

  TabList.prototype.removeIdx = function(idx) {
    this.removeTab(this.list[idx], idx);
  };

  TabList.prototype.getSelected = function() {
    return this.list[this.selected];
  };

  TabList.prototype.detatch = function() {
    this.browser = null;
  };

  function Tab(name, tabList, webview) {
    this.name = name;
    this.tabList = tabList;
    this.selected = false;
    this.url = '';
    this.loading = true;
    this.labelContainer = dce('li');
    this.label = dce('p');
    this.closeLink = dce('a');
    this.webview = webview;
    this.scriptInjectionAttempted = false;

    this.initLabelContainer();
    this.initWebview();
  };

  Tab.prototype.initLabelContainer = function() {
    var name = this.name;
    var labelContainer = this.labelContainer;
    var label = this.label;
    var closeLink = this.closeLink;

    labelContainer.setAttribute('data-name', this.name);

    this.setLabel('Loading...');

    closeLink.href = '#close-' + name;
    closeLink.innerText = 'X';

    labelContainer.appendChild(label);
    labelContainer.appendChild(closeLink);

    var that = this;
    (function() {
      var tab = that;

      labelContainer.addEventListener('click', function(e) {
        tab.tabList.selectTab(tab);
      });
      closeLink.addEventListener('click', function(e) {
        tab.tabList.removeTab(tab);
      });
    }());
  };

  Tab.prototype.initWebview = function() {
    var that = this;
    (function() {
      var tab = that;

      tab.webview.setAttribute('data-name', this.name);
      tab.webview.addEventListener(
          'loadcommit',
          function(e) { return tab.doLoadCommit(e); });
      tab.webview.addEventListener(
          'loadstop',
          function(e) { return tab.doLoadStop(e); });
      tab.webview.addEventListener(
          'newwindow',
          function(e) { return tab.doNewWindow(e); });
    }());
  };

  Tab.prototype.setLabel = function(newLabel) {
    this.label.innerText = newLabel;
  };

  Tab.prototype.select = function() {
    this.labelContainer.classList.add('selected');
    this.webview.classList.add('selected');
    this.selected = true;
  };

  Tab.prototype.deselect = function() {
    this.labelContainer.classList.remove('selected');
    this.webview.classList.remove('selected');
    this.selected = false;
  };

  Tab.prototype.detach = function() {
    this.tabList = null;
  };

  Tab.prototype.getWebview = function() {
    return this.webview;
  };

  Tab.prototype.isLoading = function() {
    return this.loading;
  };

  Tab.prototype.doLoadCommit = function(e) {
    this.loading = true;
    this.scriptInjectionAttempted = false;
    this.url = e.url;
    this.tabList.browser.doTabNavigating(this, e.url);
  };

  Tab.prototype.doLoadStop = function(e) {
    this.loading = false;
    this.tabList.browser.doTabNavigated(this, e.url);
    if (!this.scriptInjectionAttempted) {
      // Try to inject title-update-messaging script
      console.log('Attempting to inject title.js');
      var tab = this;
      this.webview.executeScript(
          {'file': 'title.js'},
          function(results) { return tab.doScriptInjected(results); });
      this.scriptInjectionAttempted = true;
    }
  };

  Tab.prototype.doScriptInjected = function(results) {
    if (!results || !results.length) {
      console.log('Failed to inject title.js', webview);
    } else {
      console.log('Injected title.js');

      // Prepare to accept title update messages from webview
      console.log('Binding to message events');
      var that = this;
      (function() {
        var tab = that;
        window.addEventListener('message', function(e) {
          console.log('Received message', e.data);
          tab.setLabel(e.data);
        });
      }());

      // Send a message to the webview so it can get a reference to
      // the embedder
      console.log('Posting empty message');
      this.webview.contentWindow.postMessage('', '*');
    }
  };

  Tab.prototype.doNewWindow = function(e) {
    var newWebview = dce('webview');
    e.window.attach(newWebview);
    this.tabList.append(newWebview);
  };

  Tab.prototype.stopNavigation = function() {
    this.webview.stop();
  };

  Tab.prototype.doReload = function() {
    this.webview.reload();
  };

  Tab.prototype.goBack = function() {
    this.webview.back();
  };

  Tab.prototype.goForward = function() {
    this.webview.forward();
  };

  Tab.prototype.navigateTo = function(url) {
    this.stopNavigation();
    this.webview.src = url;
  };

  return {
    'TabList': TabList,
    'Tab': Tab
  };
}());
