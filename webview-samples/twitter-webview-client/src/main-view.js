"use strict";

$(document).ready(function() {
    loaded();
});

var loaded = function() {
    var webView = $('#main-webview')
    console.log('trying? ' + webView + ' ' + webView.get(0));
    
    webView.attr('src', 'http://www.twitter.com/');
    webView.on('loadstop', function() {
        console.log('trying to inject');
        injectCSS(webView.get(0), 'css/injected.css');
    });
    
    console.log('register webview');
    webView.on('newwindow', function(e) {
        if (e.originalEvent.targetUrl.indexOf('https://www.twitter.com/settings') == 0) {
            chrome.app.window.create('../html/settings.html', {
              'id': 'settings',
              'width': 900,
              'height': 600,
              'minWidth': 900,
              'minHeight': 600,
              'maxWidth': 900,
              'maxHeight': 600,
              'singleton': true
            });
            return;
        }
        /*
        else if (e.originalEvent.targetUrl.indexOf('https://twitter.com/') == 0) {
          console.log(e.originalEvent.targetUrl);
          chrome.app.window.create('../html/profile.html', {
            'id': 'profile',
            'width': 900,
            'height': 600,
            'singleton': true
          }, function(createdWindow) {
          });
          return;
        }
        */
        console.log(e.originalEvent.targetUrl);
        window.open(e.originalEvent.targetUrl);
    });
}
