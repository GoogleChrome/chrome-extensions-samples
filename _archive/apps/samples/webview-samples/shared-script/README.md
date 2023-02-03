<a target="_blank" href="https://chrome.google.com/webstore/detail/cbdacningpambfjjejgfebeagmhpdcko">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Accessing the main world with `<webview>`.executeScript()

Web view content scripts run in *an isolated world*. This means that they can
access the current page's DOM, but cannot share objects with scripts included
in the DOM because scripts in the DOM run in the *main world*. For a more
detailed explanation, checkout [this
video](https://www.youtube.com/watch?v=laLudeUmXHM).

Running in an isolated world is usually what the developer wants because
access to the DOM is enough. Sometimes, the developer may want to access
Javascript objects in the main world. This sample shows good and bad examples
of injecting Javascript into a `<webview>` that is intended to run in the
main world. To do this correctly, content script must create a `<script>` tag
and inject it into the DOM. Then, the script contained within the `<script>`
tag will be run in the main world.

The sample shows a page that contains an animated dragon. The injected script
adds the ability to construct dragons that animate in sync. In order to do
so, the script needs access to the `Dragon`
[FOAM](http://foam-framework.github.io/foam/) model. To gain access, the
injected script inserts a `<script>` tag into the DOM.

The sample contains two app windows: *Incorrect injection* attempts to inject
the script directly and *Correct injection* injects the script into a
`<script>` tag in the DOM.

## Resources

* [Video about isolated worlds](https://www.youtube.com/watch?v=laLudeUmXHM)
* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [FOAM](http://foam-framework.github.io/foam/)


## Screenshot
![screenshot](/apps/samples/webview-samples/shared-script/assets/screenshot_1280_800.png)
