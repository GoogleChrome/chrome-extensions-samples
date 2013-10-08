# Wikipedia viewer

This is a basic Wikipedia viewer implemented as a packaged app.

Chrome 31 introduces a new mechanism to allow apps to intercept navigations to URLs that match a given pattern or patterns.

Using that mechanism, this sample app intercepts Wikipedia desktop and mobile URLs, normilizes them to the mobile version, and displays the result in a webview.

Note that at least in this initial version of the feature in Chrome 31 stable channel, the Chrome Web Store will reject any apps that attempt to claim URLs not owned by the app's developer (per the Store's definition of ownership and the corresponding verification procedure). That means that this app is for sample purposes only: it cannot be uploaded to the Store.

## Resources

* [Manifest](http://developer.chrome.com/apps/manifest/url_handlers.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
