<a target="_blank" href="https://chrome.google.com/webstore/detail/hhflblflkeainajnkamabjibdbfnbilb">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Declarative Web Request API

**Note:** The [declarative web request
API](https://developer.chrome.com/extensions/declarativeWebRequest) is
available only on the [beta
channel](https://www.google.com/landing/chrome/beta/) and [dev
channel](http://www.chromium.org/getting-involved/dev-channel). This sample
will not work on [stable channel](https://www.google.com/chrome/browser/)
builds.

This sample shows how to use the declarative web request API with a
webview. The app implements a simple content blocker for URLs that match a
[RE2 regular expression](https://code.google.com/p/re2/wiki/Syntax). The
default pattern blocks hosts that contain `blogspot.` (such as blogspot.com
blogs) or `gstatic.` (such as thumbnails in Google image search). Top frame
and sub-frame navigation redirects the whole webview to a "page blocked" page
(see screenshot left). Image loads are redirected to a dummy image that
contains a shortened version of the image URL as text (see screenshot
right). The user can modify the URL matching pattern using a form on the
top-right. Content blocking actions are logged beneath the form on the
top-right.

## Resources

* [Declarative Web Request API](https://developer.chrome.com/extensions/declarativeWebRequest)
* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)


## Screenshot
![screenshot](/apps/samples/webview-samples/declarative-web-request/assets/screenshot_1280_800.png)
