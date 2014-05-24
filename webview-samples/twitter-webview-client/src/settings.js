"use strict";

$(document).ready(function() {
    loaded();
});

var loaded = function() {
    var webView = $('#main-webview')
    
    webView.on('loadstop', function() {
        console.log('trying to inject');
        injectCSS(webView.get(0), 'css/injected-settings.css');
    });
}
