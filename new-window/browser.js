var browser = (function(configModule, tabsModule) {
  function Browser(
    controlsContainer,
    back,
    forward,
    home,
    reload,
    locationForm,
    locationBar,
    tabContainer,
    contentContainer,
    newTabElement) {
    this.controlsContainer = controlsContainer;
    this.back = back;
    this.forward = forward;
    this.reload = reload;
    this.home = home;
    this.locationForm = locationForm;
    this.locationBar = locationBar;
    this.newTabElement = newTabElement;
    this.tabs = new tabsModule.TabList(
        'tabs',
        this,
        tabContainer,
        contentContainer,
        newTabElement);

    this.init();
  };

  Browser.prototype.init = function() {
    var that = this;
    (function() {
      var browser = that;

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
          if (browser.tabs.getSelected().isLoading()) {
            document.body.classList.remove('loading');
          }
        }
      );

      browser.locationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        browser.tabs.getSelected().navigateTo(browser.locationBar.value);
      });

      browser.newTabElement.addEventListener(
        'click',
        function(e) { return browser.doNewWindow(e); });

      console.log('Binding to message events');
      window.addEventListener('message', function(e) {
        if (e.data) {
          var data = JSON.parse(e.data);
          if (data.name && data.title) {
            browser.tabs.setLabelByName(data.name, data.title);
          } else {
            console.log(
                'Error: Expected message to contain {name, title}, but got:',
                data);
          }
        } else {
          console.log('Error: Message contains no data');
        }
      });

      browser.doNewWindow();
      browser.tabs.selectIdx(0);
      browser.doLayout();
    }());
  };

  Browser.prototype.doLayout = function(e) {
    var controlsHeight = this.controlsContainer.offsetHeight;
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var contentWidth = windowWidth;
    var contentHeight = windowHeight - controlsHeight;

    var webview = this.tabs.getSelected().getWebview();

    this.tabs.contentContainer.style.width = contentWidth + 'px';
    this.tabs.contentContainer.style.height = contentHeight + 'px';
    webview.style.width = contentWidth + 'px';
    webview.style.height = contentHeight + 'px';
  };

  // New window that is NOT triggered by existing window
  Browser.prototype.doNewWindow = function(e) {
    var webview = document.createElement('webview');
    var tab = this.tabs.append(document.createElement('webview'));
    tab.navigateTo(configModule.homepage);
  };

  Browser.prototype.doKeyDown = function(e) {
    // TODO: Integrate some nice shortcut keys into the browser
  };

  Browser.prototype.doTabNavigating = function(tab, url) {
    if (tab.selected) {
      document.body.classList.add('loading');
      this.locationBar.value = url;
    }
  };

  Browser.prototype.doTabNavigated = function(tab, url) {
    if (tab.selected) {
      document.body.classList.remove('loading');
    }
  };

  Browser.prototype.doTabSwitch = function(oldTab, newTab) {
    if (this.tabs.getSelected().isLoading()) {
      document.body.classList.add('loading');
    } else {
      document.body.classList.remove('loading');
    }
    this.locationBar.value = newTab.url;
  };

  return {'Browser': Browser};
})(config, tabs);
