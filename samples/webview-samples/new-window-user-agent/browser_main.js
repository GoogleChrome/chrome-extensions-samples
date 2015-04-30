var mainBrowser = null;
(function(browserModule) {
  var query = function(str) { return document.querySelector(str); };

  window.addEventListener('load', function(e) {
    var webview = document.createElement('webview');

    // Check for context menu API
    if (webview.contextMenus) {
      mainBrowser = new browserModule.Browser(
          query('#controls'),
          query('#back'),
          query('#forward'),
          query('#home'),
          query('#reload'),
          query('#location-form'),
          query('#location'),
          query('#tab-container'),
          query('#content-container'),
          query('#new-tab'));
    } else {
      // When API not available, show lightbox
      query('#lightbox-overlay').classList.remove('hide');
      query('#lightbox').classList.remove('hide');
    }
  });
})(browser);
