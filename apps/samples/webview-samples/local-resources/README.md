<a target="_blank" href="https://chrome.google.com/webstore/detail/nfeplfjagjlljomimjealpedhjgamkle">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Package-Local Resources

This sample shows good and bad examples of mixing a `<webview>` tag that
embeds trusted content packaged within an app with a tag that embeds
untrusted web content that may crash. In the bad example, trusted and
untrusted content share the same
[partition](https://developer.chrome.com/apps/tags/webview#partition);
simulating a crash in the untrusted `webview` will also crash the trusted
`webview`. The good example separates the two into different partitions;
simulating a crash in the untrusted `webview` does not affect the trusted
`webview`.

Finally, the `manifest.json` file contains an example of granting permissions
to particular `webview` partitions to access trusted package-local content.

## Resources

* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)
* [Partitions](https://developer.chrome.com/apps/tags/webview#partition)


## Screenshot
![screenshot](/apps/samples/webview-samples/local-resources/assets/screenshot_1280_800.png)
