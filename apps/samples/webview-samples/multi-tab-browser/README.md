<a target="_blank" href="https://chrome.google.com/webstore/detail/nfcmophndjlljioblddmepjbcfnocnak">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Multi-Tab Browser

Sample that shows one way to combine the [New Window
API](https://developer.chrome.com/apps/tags/webview#event-newwindow) with the
[User Agent
API](https://developer.chrome.com/apps/tags/webview#method-setUserAgentOverride)
for
[webviews](http://developer.chrome.com/apps/app_external.html#webview). The
app combines the
[New Window User Agent Sample](https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/webview-samples/new-window-user-agent)
and the [Browser Sample](https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/webview-samples/browser).

## Features

* All features from the [New Window User Agent Sample](https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/webview-samples/new-window-user-agent)
* All features from the
  [Browser Sample](https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/webview-samples/browser) except for [clearData API](https://developer.chrome.com/apps/tags/webview#method-clearData) and simulate crash.
* Added a new permissions feature based on [webview permissionrequest event](https://developer.chrome.com/apps/tags/webview#event-permissionrequest)

## Limitations

* See [New Window
Sample](https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/webview-samples/new-window)

## Resources

* [Webview New Window API](https://developer.chrome.com/apps/tags/webview#event-newwindow)
* [User Agent API](https://developer.chrome.com/apps/tags/webview#method-setUserAgentOverride)
* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)

## Screenshot
![screenshot](/apps/samples/webview-samples/multi-tab-browser/assets/screenshot_1280_800.png)
