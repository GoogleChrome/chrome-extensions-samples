/**
 * Bindings that depend on the particular collection of webviews in browser.html
 *
 * @see https://developer.chrome.com/apps/tags/webview#method-setUserAgentOverride
 */
var bindings = {
  'android': 'Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
  'ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3',
  'nokia': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)',
  'bb-playbook': 'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML, like Gecko) Version/7.2.1.0 Safari/536.2+'
};

window.addEventListener('load', function(e) {
  for (var key in bindings) {
    document.querySelector('webview[data-name="' + key + '"]').
        setUserAgentOverride(bindings[key]);
  }
});
