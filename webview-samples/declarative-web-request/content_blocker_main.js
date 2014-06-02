var mainContentBlocker = null;
(function(configModule, contentBlockerModule) {
  var query = function(str) { return document.querySelector(str); };

  window.addEventListener('load', function(e) {
    mainContentBlocker = new contentBlockerModule.ContentBlocker(
        query('#content-webview'),
        query('#form'),
        query('#submit'),
        query('#url-pattern'),
        query('#reset'),
        query('#console'));
  });
}(config, contentBlocker));
