var mainImgOverride = null;
(function(configModule, imgOverrideModule) {
  var query = function(str) { return document.querySelector(str); };

  window.addEventListener('load', function(e) {
    mainImgOverride = new imgOverrideModule.ImgOverride(
        query('#content-webview'),
        query('#form'),
        query('#submit'),
        query('#url-pattern'),
        query('#reset'),
        query('#console'));
  });
}(config, imgOverride));
