var mainImgOverride = null;
(function(configModule, imgOverrideModule) {
  var query = function(str) { return document.querySelector(str); };

  window.addEventListener('load', function(e) {
    mainImgOverride = new imgOverrideModule.ImgOverride(
        query('#content-webview'),
        query('#css-form'),
        query('#url-pattern'));
  });
}(config, imgOverride));
