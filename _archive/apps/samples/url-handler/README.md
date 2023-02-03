<a target="_blank" href="https://chrome.google.com/webstore/detail/pbokgdgkaaenccneanahifaakldannno">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# URL Handler Sample App

This is a basic Wikipedia viewer implemented as a packaged app.

Chrome 31 introduces a new mechanism to allow apps to intercept navigations to URLs that match a given pattern or patterns.

Using that mechanism, this sample app intercepts Wikipedia desktop and mobile URLs, normalizes them to the mobile version, and loads the result into a webview.

Note that at least in this initial version of the feature in Chrome 31 stable channel, the Chrome Web Store will reject any apps that attempt to claim URLs not owned by the app's developer (per the Store's definition of ownership and the corresponding verification procedure). That means that this app is for sample purposes only: it can't be uploaded to the Store, however it can be installed locally in developer's mode as unpackaged app.

## Resources

* [url_handlers in manifest](http://developer.chrome.com/apps/manifest/url_handlers.html)
* [chrome.app.runtime.onLaunched](http://developer.chrome.com/apps/app_runtime.html#event-onLaunched)
* [webview](https://developer.chrome.com/apps/tags/webview)
* [chrome.storage](http://developer.chrome.com/apps/storage.html)

## Screenshot
![screenshot](/apps/samples/url-handler/assets/screenshot_1280_800.png)
