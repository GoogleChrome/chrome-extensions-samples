"use strict";

var myCssHack = function () {
    if (!registered) {
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(cssToInject));
        document.body.appendChild(style);
    
        var elt = document.getElementById('user-dropdown-toggle');
        if (elt != null) {
          elt.addEventListener('click', function(e) {
            window.open('https://www.twitter.com/settings');
            e.preventDefault();
            e.stopPropagation();
          });
        }
        
        var linksNodeList = document.getElementsByClassName('js-user-profile-link');
      	var links = [].slice.call(linksNodeList);
        links.forEach(function(element ,idx){
          element.addEventListener('click', function(e) {
            window.open(this.href, 'profile');
            e.preventDefault();
            e.stopPropagation();
          });
        });
        registered = true;
    }
};
    
var injectCSS = function(webView, cssURL) {
    var url = chrome.runtime.getURL(cssURL);
    $.get(url, function(data) {
        var cssToInject = data;
        var js = 'var registered';
        webView.executeScript({ code: js });
        js = 'var cssToInject = ' + JSON.stringify(cssToInject) + ';';
        webView.executeScript({ code: js });
        webView.executeScript({ code: '(' + myCssHack + ')()' });
    });
}
