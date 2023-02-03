var tabs = (function(popupModule) {
  var dce = function(str) { return document.createElement(str); };

  var TabList = function(name, browser, tabContainer, contentContainer, newTabElement) {
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

  TabList.prototype.getNumTabs = function() {
    return this.list.length;
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
      console.warn('Warning: Failed to find tab in list', tab);
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
      console.warn(
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

    this.tabContainer.insertBefore(tab.labelContainer, this.newTabElement);
    this.contentContainer.appendChild(tab.webviewContainer);

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
        // If this is the last tab, then select previous, else select next
        selectedIdx = (this.selected + 1 == this.list.length) ?
            this.selected - 1 :
            this.selected + 1;
        this.selectIdx(selectedIdx);
      }

      this.tabContainer.removeChild(tab.labelContainer);
      this.contentContainer.removeChild(tab.webviewContainer);

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

  var Tab = function(name, tabList, webview) {
    this.name = name;
    this.tabList = tabList;
    this.selected = false;
    this.url = '';
    this.loading = true;
    this.overlay = false;
    this.labelContainer = dce('li');
    this.label = dce('p');
    this.closeLink = dce('a');
    this.webviewContainer = dce('div');
    this.popupConfirmBoxList = new popupModule.PopupConfirmBoxList(dce('ul'));
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

    (function(tab) {
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
    }(this));
  };

  Tab.prototype.initWebview = function() {
    this.webview.setAttribute('data-name', this.name);
    this.webviewContainer.setAttribute('data-name', this.name);
    this.webviewContainer.classList.add('webview-container');

    (function(tab) {
      tab.webview.addEventListener(
          'loadcommit',
          function(e) { return tab.doLoadCommit(e); });
      tab.webview.addEventListener(
          'loadstop',
          function(e) { return tab.doLoadStop(e); });
      tab.webview.addEventListener(
          'newwindow',
          function(e) { return tab.doNewTab(e); });
    }(this));

    this.webviewContainer.appendChild(this.popupConfirmBoxList.getListElement());
    this.webviewContainer.appendChild(this.webview);
  };

  Tab.prototype.setLabel = function(newLabel) {
    this.label.innerText = newLabel;
  };

  Tab.prototype.select = function() {
    this.labelContainer.classList.add('selected');
    this.webviewContainer.classList.add('selected');
    this.webview.classList.add('selected');
    this.selected = true;
  };

  Tab.prototype.deselect = function() {
    this.labelContainer.classList.remove('selected');
    this.webviewContainer.classList.remove('selected');
    this.webview.classList.remove('selected');
    this.selected = false;
  };

  Tab.prototype.detach = function() {
    this.tabList = null;
  };

  Tab.prototype.getWebview = function() {
    return this.webview;
  };

  Tab.prototype.getWebviewContainer = function() {
    return this.webviewContainer;
  };

  Tab.prototype.isLoading = function() {
    return this.loading;
  };

  Tab.prototype.doLoadCommit = function(e) {
    if (!e.isTopLevel) {
      return;
    }

    this.loading = true;
    this.scriptInjectionAttempted = false;
    this.url = e.url;
    this.tabList.browser.doTabNavigating(this, e.url);
  };

  Tab.prototype.doLoadStop = function(e) {
    if (this.loading) {
      this.tabList.browser.doTabNavigated(this, e.url);
    }
    this.loading = false;
    if (!this.scriptInjectionAttempted) {
      // Try to inject title-update-messaging script
      var tab = this;
      this.webview.executeScript(
          {'file': 'title.js'},
          function(results) { return tab.doScriptInjected(results); });
      this.scriptInjectionAttempted = true;
    }
  };

  Tab.prototype.doScriptInjected = function(results) {
    if (!results || !results.length) {
      console.warn('Warning: Failed to inject title.js', webview);
    } else {
      // Send a message to the webview so it can get a reference to
      // the embedder
      var data = {'name': this.name };
      this.webview.contentWindow.postMessage(JSON.stringify(data), '*');
    }
  };

  // New window triggered by existing window
  Tab.prototype.doNewTab = function(e) {
    e.preventDefault();

    var dis = e.windowOpenDisposition;

    if (dis == 'new_background_tab' || dis == 'new_foreground_tab') {
      var newWebview = dce('webview');
      e.window.attach(newWebview);
      var newTab = this.tabList.append(newWebview);
      if (e.windowOpenDisposition == 'new_foreground_tab') {
        this.tabList.selectTab(newTab);
      }
    } else {
      this.popupConfirmBoxList.append(e);
    }
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
}(popup));
