// Global app's settings.
var App = function() {
  this.defaultSettings = null;
};

App.prototype.getSettings_ = function(callback) {
  if (this.defaultSettings !== null) {
    callback(this.defaultSettings);
  } else {
    chrome.storage.local.get(
      { width: 600, height: 800 },
      function(settings) {
        this.defaultSettings = settings;
        callback(settings);
      }.bind(this)
    );
  }
};

App.prototype.updateSettings_ = function(settings) {
  this.defaultSettings = settings;
  // NOTE: The method is asynchronous, but there's no need to wait since
  // the stored value is used only on app's startup -- the rest of the code uses
  // the cached value.
  chrome.storage.local.set(settings);
};

var app = new App();

// The app is multi-windowed. This is an object that incapsulates a single
// window's state.
var AppWindow = function(startUrl) {
  this.startUrl_ = startUrl;
  this.win_ = null;
  this.bounds_ = { width: -1, height: -1 };
  this.webview_ = null;

  app.getSettings_(this.createWindow_.bind(this));
};

// Create a new window. Defer navigating the webview until the DOM is loaded.
AppWindow.prototype.createWindow_ = function(settings) {
  chrome.app.window.create(
    'main.html',
    {
      id: "mainwin",
      innerBounds: { width: settings.width, height: settings.height },
      frame: 'chrome'
    },
    function(win) {
      this.win_ = win;
      this.win_.contentWindow.addEventListener('DOMContentLoaded',
                                               this.onLoad_.bind(this));
      this.win_.onBoundsChanged.addListener(this.onBoundsChanged_.bind(this));
    }.bind(this)
  );
}

// Resize the window's webview to the window's size and load the start URL.
AppWindow.prototype.onLoad_ = function() {
  this.webview_ = this.win_.contentWindow.document.getElementById('webview');
  this.onBoundsChanged_();
  this.loadArticle(this.startUrl_);
}

// Update this window's cached bounds and, if the window has been resized as
// opposed to just moved, also update the global app's default window size.
AppWindow.prototype.onBoundsChanged_ = function() {
  var bounds = this.win_.innerBounds;
  if (bounds.width !== this.bounds_.width ||
      bounds.height !== this.bounds_.height) {
      app.updateSettings_({ width: bounds.width, height: bounds.height });
  }
  this.bounds_ = bounds;
  this.webview_.style.height = bounds.height + 'px';
  this.webview_.style.width = bounds.width + 'px';
}

// Navigate the window's webview to an article's URL.
AppWindow.prototype.loadArticle = function(url) {
  this.webview_.src = url;
};

// Create a new app window and load the requested Wikipedia article.
chrome.app.runtime.onLaunched.addListener(function(launchData) {
  var articleUrl = null;

  if (launchData.id) {
    // We are called to handle a URL that matches one of our url_handlers.
    if (launchData.id === 'wiki_article') {
      // Convert the desktop URL to a mobile one.
      articleUrl = launchData.url.replace("en.wikipedia", "en.m.wikipedia");
    } else if (launchData.id === 'mobile_wiki_article') {
      articleUrl = launchData.url;
    } else {
      console.error("Unexpected URL handler ID: " + launchData.id);
    }
  } else {
    articleUrl = "http://en.m.wikipedia.org";
  }

  if (articleUrl)
    new AppWindow(articleUrl);
});
