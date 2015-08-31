var browser = (function(configModule, tabsModule) {
  var dce = function(str) { return document.createElement(str); };

  var Browser = function(
    controlsContainer,
    back,
    forward,
    home,
    reload,
    find,
    zoom,
    locationForm,
    locationBar,
    tabContainer,
    contentContainer,
    findbox,
    zoombox,
    exitbox,
    permissionbox,
    newTabElement) {
    this.controlsContainer = controlsContainer;
    this.back = back;
    this.forward = forward;
    this.home = home;
    this.reload = reload;
    this.find = find;
    this.zoom = zoom;
    this.locationForm = locationForm;
    this.locationBar = locationBar;
    this.tabContainer = tabContainer;
    this.contentContainer = contentContainer;
    this.newTabElement = newTabElement;
    this.findBoxController = new findTool.FindController(findbox, this);
    this.zoomBoxController = new zoomTool.ZoomController(zoombox, this);
    this.exitBoxController = new exitTool.ExitController(exitbox, this);
    this.permissionBoxController = new permissionTool.PermissionController(
      permissionbox, this);
    this.tabs = new tabsModule.TabList(
        'tabs',
        this,
        tabContainer,
        contentContainer,
        newTabElement);

    this.init();
  };

  Browser.prototype.init = function() {
    (function(browser) {
      window.addEventListener('resize', function(e) {
        browser.doLayout(e);
      });

      window.addEventListener('keydown', function(e) {
        browser.doKeyDown(e);
      });

      browser.back.addEventListener('click', function(e) {
        browser.tabs.getSelected().goBack();
      });

      browser.forward.addEventListener('click', function() {
        browser.tabs.getSelected().goForward();
      });

      browser.home.addEventListener('click', function() {
        browser.tabs.getSelected().navigateTo(configModule.homepage);
      });

      browser.reload.addEventListener('click', function() {
        var tab = browser.tabs.getSelected();
        if (tab.isLoading()) {
          tab.stopNavigation();
        } else {
          tab.doReload();
        }
      });
      browser.reload.addEventListener(
        'webkitAnimationIteration',
        function() {
          // Between animation iterations: If loading is done, then stop spinning
          if (!browser.tabs.getSelected().isLoading()) {
            document.body.classList.remove('loading');
          }
        }
      );
      browser.find.addEventListener('click', function() {
        browser.findBoxController.toggleVisibility();
      });
      browser.zoom.addEventListener('click', function() {
        browser.zoomBoxController.toggleVisibility();
      });

      browser.locationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        browser.closeAllMessagesAndDialoges();
        browser.tabs.getSelected().navigateTo(browser.locationBar.value);
      });

      browser.newTabElement.addEventListener(
        'click',
        function(e) { return browser.doNewTab(e); });

      browser.closeAllMessagesAndDialoges = function() {
        this.findBoxController.deactivate();
        this.zoomBoxController.deactivate();
        this.permissionBoxController.deactivate();
      };

      window.addEventListener('message', function(e) {
        if (e.data) {
          var data = JSON.parse(e.data);;
          var type = data.type;
          if (type == 'titleResponse') {
            if (data.tabName && data.title) {
              browser.tabs.setLabelByName(data.tabName, data.title);
            } else {
              console.warn(
                  'Warning: Expected message from guest to contain {tabName, title}, but got:',
                  data);
            }
          } else {
            console.warn('Warning: Unexpected message received', e);
          }
        } else {
          console.warn('Warning: Empty message (no data) received', e);
        }
      });

      var webview = dce('webview');
      var tab = browser.tabs.append(webview);

      // Globals window.userAgent and/or window.newWindowEvent may be injected
      // by opener
      if (window.userAgent) {
        webview.setUserAgentOverride(window.userAgent);
      }
      if (window.newWindowEvent) {
        window.newWindowEvent.window.attach(webview);
      } else {
        tab.navigateTo(configModule.homepage);
      }
      browser.tabs.selectTab(tab);
    }(this));
  };

  Browser.prototype.doLayout = function(e) {
    var controlsHeight = this.controlsContainer.offsetHeight;
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var contentWidth = windowWidth;
    var contentHeight = windowHeight - controlsHeight;

    var tab = this.tabs.getSelected();
    var webview = tab.getWebview();
    var webviewContainer = tab.getWebviewContainer();

    var layoutElements = [
      this.contentContainer,
      webviewContainer,
      webview];
    for (var i = 0; i < layoutElements.length; ++i) {
      layoutElements[i].style.width = contentWidth + 'px';
      layoutElements[i].style.height = contentHeight + 'px';
    }
  };

  // New window that is NOT triggered by existing window
  Browser.prototype.doNewTab = function(e) {
    var tab = this.tabs.append(dce('webview'));
    tab.navigateTo(configModule.homepage);
    this.tabs.selectTab(tab);
    return tab;
  };

  Browser.prototype.doKeyDown = function(e) {
    if (e.keyCode === 27) {
      this.closeAllMessagesAndDialoges();
    }
    if (e.ctrlKey) {
      switch(e.keyCode) {
        // Ctrl+T
        case 84:
        this.doNewTab();
        break;
        // Ctrl+W
        case 87:
        e.preventDefault();
        this.tabs.removeTab(this.tabs.getSelected());
        break;
        case 122:
        chrome.app.window.current().fullscreen();
      }
      // Ctrl + [1-9]
      if (e.keyCode >= 49 && e.keyCode <= 57) {
        var idx = e.keyCode - 49;
        if (idx < this.tabs.getNumTabs()) {
          this.tabs.selectIdx(idx);
        }
      }
    }
  };

  Browser.prototype.doTabNavigating = function(tab, url) {
    if (tab.selected) {
      document.body.classList.add('loading');
      this.locationBar.value = url;
    }
  };

  Browser.prototype.doTabNavigated = function(tab, url) {
    this.updateControls();
  };

  Browser.prototype.doTabSwitch = function(oldTab, newTab) {
    this.updateControls();
  };

  Browser.prototype.updateControls = function() {
    var selectedTab = this.tabs.getSelected();
    if (selectedTab.isLoading()) {
      document.body.classList.add('loading');
    }
    var selectedWebview = selectedTab.getWebview();
    this.back.disabled = !selectedWebview.canGoBack();
    this.forward.disabled = !selectedWebview.canGoForward();
    if (this.locationBar.value != selectedTab.url) {
      this.locationBar.value = selectedTab.url;
    }
  };

  Browser.prototype.closeBrowser = function() {
    this.exitBoxController.activate();
  }

  return {'Browser': Browser};
})(config, tabs);
