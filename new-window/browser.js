var browser = (function(configModule, tabsModule) {
  function Browser(
    controlsContainer,
    back,
    forward,
    home,
    reload,
    // crash,
    locationForm,
    locationBar,
    // zoom,
    // find,
    tabContainer,
    contentContainer) {
    this.controlsContainer = controlsContainer;
    this.back = back;
    this.forward = forward;
    this.reload = reload;
    this.home = home;
    // this.crash = crash;
    this.locationForm = locationForm;
    this.locationBar = locationBar;
    // this.zoom = zoom;
    // this.find = find;
    this.tabs = new tabsModule.TabList(
        'tabs',
        this,
        tabContainer,
        contentContainer);

    this.init();
  };

  // var tabs = new tabsModule.TabList(
  //   'tabs',
  //   query('.tab-container'),
  //   query('.content-container'));
  // var locationInput = query('#location');

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

      // browser.crash.addEventListener('click', function() {
      //   browser.tabs.getSelected().doTerminate();
      // });

      browser.locationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        browser.tabs.getSelected().navigateTo(browser.locationBar.value);
      });

      var webview = document.createElement('webview');
      browser.tabs.append(document.createElement('webview'));
      browser.doLayout();
      browser.tabs.getSelected().navigateTo(configModule.homepage);
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

  Browser.prototype.doKeyDown = function(e) {
    // TODO: Integrate some nice shortcut keys into the browser
  };

  Browser.prototype.doTabNavigating = function(tab, url) {
    document.body.classList.add('loading');
    this.location.value = url;
  };

  Browser.prototype.doTabNavigated = function(tab, url) {
    document.body.classList.remove('loading');
  };

  Browser.prototype.doTabSwitch = function(oldTab, newTab) {
    if (this.tabs.getSelected().isLoading()) {
      document.body.classList.add('loading');
    } else {
      document.body.classList.remove('loading');
    }
    this.location.value = newTab.url;
  };

  return {'Browser': Browser};
})(config, tabs);
