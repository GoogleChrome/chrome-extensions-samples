var mainContentBlocker = null;
(function(configModule, contentBlockerModule) {
  var query = function(str) { return document.querySelector(str); };

  window.addEventListener('load', function(e) {
    var webview = query('#content-webview');

    // Check for declarative web request API
    if (webview.request &&
        webview.request.onRequest &&
        webview.request.onMessage) {
      mainContentBlocker = new contentBlockerModule.ContentBlocker(
          query('#content-webview'),
          query('#form'),
          query('#submit'),
          query('#url-pattern'),
          query('#reset'),
          query('#console'));
    } else {
      // When API not available, show lightbox
      query('#lightbox-overlay').classList.remove('hide');
      query('#lightbox').classList.remove('hide');
    }
  });
}(config, contentBlocker));
