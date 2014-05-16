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
    this.tabContainer.appendChild(tab.label);
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
    this.label = dce('li');
    this.webview = webview;

    this.initLabel();
    this.initWebview();
  };

  Tab.prototype.initLabel = function() {
    var name = this.name;
    var label = this.label;
    var link = dce('a');
    var closeLink = dce('a');

    label.setAttribute('data-name', this.name);

    link.href = '#' + name;
    link.innerText = name;

    closeLink.href = '#close-' + name;
    closeLink.innerText = 'X';

    label.appendChild(link);
    label.appendChild(closeLink);

    var that = this;
    (function() {
      var tab = that;
      link.addEventListener('click', function(e) {
        tab.tabList.select(tab);
      });
      closeLink.addEventListener('click', function(e) {
        tab.tabList.removeTab(tab);
      });
    }());
  };

  Tab.prototype.initWebview = function() {
    this.webview.setAttribute('data-name', this.name);
    this.webview.addEventListener('loadcommit', this.do);
    this.webview.addEventListener('loadstop', this.do);
  };

  Tab.prototype.select = function() {
    this.label.classList.add('selected');
    this.webview.classList.add('selected');
    this.selected = true;
  };

  Tab.prototype.deselect = function() {
    this.label.classList.remove('selected');
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
    this.url = e.url;
    this.tabList.browser.doTabNavigating(this, e.url);
  };

  Tab.prototype.doLoadStop = function(e) {
    this.loading = false;
    this.tabList.browser.doTabNavigated(this, e.url);
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
