<a target="_blank" href="https://chrome.google.com/webstore/detail/loimmcmmgnhkbppokdpfhlccebcpicld">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# AppSquare

This is a basic Foursquare client implemented as a packaged app.

It just displays recent checkins of the logged in user's friends. To log into Foursquare, it uses the [identity API](http://developer.chrome.com/apps/identity.html) (specfically, the `launchWebAuthFlow` method). Once it gets the OAuth token, it uses the [storage API](http://developer.chrome.com/apps/storage.html) to persist it. It also uses the [W3C Geolocation API](http://www.w3.org/TR/geolocation-API/) to pass in the current location to the Foursquare API.

When running it unpacked, it will normally have a different ID (the unpacked
extension ID is a hash of the path on disk). However, this will result in the
auth API not working, since the redirect URL will be different. To force the
unpacked app to have the same ID, add this key and value to `manifest.json`:

    "key": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDnyZBBnfu+qNi1x5C0YKIob4ACrA84HdMArTGobttMHIxM2Z6aLshFmoKZa/pbyQS6D5yNywr4KM/llWiY2aV2puIflUxRT8SjjPehswCvm6eWQM+r3mB755m48x+diDl8URJsX4AJ3pQHnKWEvitZcuBh0GTfsLzKU/BfHEaH7QIDAQAB"
(this is a base 64 encoded version of the app's public key)

The key *must* be removed before uploading it to the store.

## Resources

* [Identity](http://developer.chrome.com/apps/app.identity.html)
* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Window](http://developer.chrome.com/apps/app.window.html)
     
## Screenshot
![screenshot](/apps/samples/appsquare/assets/screenshot_1280_800.png)

