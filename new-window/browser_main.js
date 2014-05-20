(function(browserModule) {
  var query = function(str) { return document.querySelector(str); };
  var browser = null;

  window.addEventListener('load', function(e) {
    browser = new browserModule.Browser(
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
  });
})(browser);
