<a target="_blank" href="https://chrome.google.com/webstore/detail/edggnmnajhcbhlnpjnogkjpghaikidaa">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Browser

Sample that shows how to use the [webview tag](http://developer.chrome.com/apps/app_external.html#webview)
in an app to create a mini browser.

The app's main window contains a `<webview>` that is sized to fit most of it
(via the `width` and `height` attributes). The location bar is used to
update its `src` attribute.

`<webview>` is the preferred way for you to load web content into your app. It
runs in a separate process and has its own storage, ensuring the security and
reliability of your application.

## Resources

* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)


## Screenshot
![screenshot](/apps/samples/webview-samples/browser/assets/screenshot_1280_800.png)
