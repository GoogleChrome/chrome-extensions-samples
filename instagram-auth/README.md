# AppSquare

This is a basic Instagram client implemented as a packaged app.  This demonstration simply displays the users logged-in view as raw JSON.

To log into Instagram, it uses the [identity API](http://developer.chrome.com/trunk/apps/experimental.identity.html) (specfically, the `launchWebAuthFlow` method). Once it gets the OAuth token it makes a request to an authenticated endpoint to get the JSON feed of the user's view.

When running it unpacked, it will normally have a different ID (the unpacked
extension ID is a hash of the path on disk). However, this will result in the
auth API not working, since the redirect URL will be different. To force the
unpacked app to have the same ID, add this key and value to `manifest.json`:

    "key": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDnyZBBnfu+qNi1x5C0YKIob4ACrA84HdMArTGobttMHIxM2Z6aLshFmoKZa/pbyQS6D5yNywr4KM/llWiY2aV2puIflUxRT8SjjPehswCvm6eWQM+r3mB755m48x+diDl8URJsX4AJ3pQHnKWEvitZcuBh0GTfsLzKU/BfHEaH7QIDAQAB"
(this is a base 64 encoded version of the app's public key)

The key *must* be removed before uploading it to the store.

## Resources

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
* [Indetity](http://developer.chrome.com/trunk/apps/experimental.identity.html)
