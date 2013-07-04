"use strict";

$(document).ready(function() {
    loaded();
});

var loaded = function() {
    var webView = $('#main-webview')
    
    webView.on('loadstop', function() {
        injectCSS(webView.get(0), 'css/injected-profile.css');
    });
}
