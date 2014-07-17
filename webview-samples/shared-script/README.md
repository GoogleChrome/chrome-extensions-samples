# Accessing existing Javascript objects with `<webview>`.executeScript()

This sample shows good and bad examples of injecting Javascript into
`<webview>`, when the injected script is meant to interact with existing
scripts on the page.

Chrome app content scripts run in an isolated world. This means that scripts
injected into a `<webview>` have access to the DOM, but do not share any
other Javascript objects with scripts on the page. If a content scripts needs
access to such shared objects, then it must create a `<script>` tag and
inject it into the DOM.

The sample shows a page that contains an animated dragon. The injected script
adds the ability to construct dragons that animate in sync. In order to do
so, the script needs access to the `Dragon`
[FOAM](http://foam-framework.github.io/foam/) model. To gain access, the
injected script inserts a `<script>` tag into the DOM.

The sample contains two app windows, a "Bad app" that attempts to inject the
script directly and a "Good app" that injects the script into a `<script>`
tag in the DOM.

## Resources

* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [FOAM](http://foam-framework.github.io/foam/)


## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/webview-samples/shared_script/assets/screenshot_1280_800.png)
