var tabs = (function() {
  var dce = function(str) { return document.createElement(str); };

  function TabList(name, browser, tabContainer, contentContainer, newTabElement) {
    this.name = name;
    this.list = [];
    this.table = {};
    this.selected = 0;
    this.tabNameCounter = 0;
    this.browser = browser;
    this.tabContainer = tabContainer;
    this.contentContainer = contentContainer;
    this.newTabElement = newTabElement;
  };

  TabList.prototype.getTabIdx = function(tab) {
    var idx = 0;
    for (var i = 0; i < this.list.length; ++i) {
      if (this.list[i] == tab) {
        idx = i;
        break;
      }
    }
    if (idx < this.list.length) {
      return idx;
    } else {
      console.log('Error: Failed to find tab in list', tab);
      return -1;
    }
  };

  TabList.prototype.selectIdx = function(idx) {
    return this.selectTab(this.list[idx], idx);
  };

  TabList.prototype.selectTab = function(tab, idx) {
    var prevTab = this.list[this.selected];
    prevTab.deselect();

    if (!(idx === 0 || idx)) {
      idx = this.getTabIdx(tab);
    }
    this.selected = idx;

    tab.select();
    this.browser.doTabSwitch(prevTab, tab);
    this.browser.doLayout();

    return tab;
  };

  TabList.prototype.setLabelByName = function(tabName, tabLabel) {
    if (tabName in this.table) {
      return this.table[tabName].setLabel(tabLabel);
    } else {
      console.log(
          'Warning: Attempt to set label to "', tabLabel,
          '" on unknown tab named "', tabName, '"');
      return null;
    }
  };

  TabList.prototype.append = function(webview) {
    var tabName = this.name + '-' + this.tabNameCounter;
    this.tabNameCounter = this.tabNameCounter + 1;
    var tab = new Tab(tabName, this, webview);

    this.list.push(tab);
    this.table[tabName] = tab;

    console.log(tab.labelContainer, this.newTabElement);

    this.tabContainer.insertBefore(tab.labelContainer, this.newTabElement);
    this.contentContainer.appendChild(tab.webview);

    return tab;
  };

  TabList.prototype.removeIdx = function(idx) {
    this.removeTab(this.list[idx], idx);
  };

  TabList.prototype.removeTab = function(tab, idx) {
    if (this.list.length > 1) {
      if (!(idx === 0 || idx)) {
        idx = this.getTabIdx(tab);
      }

      var selectedIdx = this.selected;
      if (tab.selected) {
        selectedIdx = (this.selected + 1) % this.list.length;
        this.selectIdx(selectedIdx);
      }

      this.tabContainer.removeChild(tab.labelContainer);
      this.contentContainer.removeChild(tab.webview);

      tab.detach();
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

      // If we are now selecting something that comes after the removed tab,
      // then decrement the index: this.selected
      if (selectedIdx > idx) {
        this.selected = this.selected - 1;
      }

      return tab;
    } else {
      return null;
    }
  };

  TabList.prototype.getSelected = function() {
    return this.list[this.selected];
  };

  TabList.prototype.detach = function() {
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
        if (tab.tabList) {
          tab.tabList.selectTab(tab);
        }
      });
      closeLink.addEventListener('click', function(e) {
        if (tab.tabList) {
          tab.tabList.removeTab(tab);
        }
      });
    }());
  };

  Tab.prototype.initWebview = function() {
    var that = this;
    (function() {
      var tab = that;

      tab.webview.setAttribute('data-name', that.name);
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


      // Send a message to the webview so it can get a reference to
      // the embedder
      console.log('Posting message');
      var data = {'name': this.name };
      this.webview.contentWindow.postMessage(JSON.stringify(data), '*');
    }
  };

  // New window triggered by existing window
  Tab.prototype.doNewWindow = function(e) {
    e.preventDefault();

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
