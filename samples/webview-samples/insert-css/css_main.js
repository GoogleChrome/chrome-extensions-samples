var mainCss = null;
(function(configModule, cssModule) {
  var query = function(str) { return document.querySelector(str); };

  window.addEventListener('load', function(e) {
    mainCss = new cssModule.Css(
        configModule.urlPattern,
        configModule.cssFilename,
        query('#content-webview'),
        query('#css-form'),
        query('#location-regex'),
        query('#css-contents'));
  });
}(config, css));
