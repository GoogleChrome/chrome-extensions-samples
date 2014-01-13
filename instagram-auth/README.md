<a target="_blank" href="https://chrome.google.com/webstore/detail/baaenjnmlaejajnalldcecpdafeggelb">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Instagram Demo

This is a basic Instagram client implemented as a packaged app.  This demonstration simply displays the users logged-in view as raw JSON.

To log into Instagram, it uses the [identity API](http://developer.chrome.com/apps/identity.html) (specfically, the `launchWebAuthFlow` method). Once it gets the OAuth token it makes a request to an authenticated endpoint to get the JSON feed of the user's view.

When running it unpacked, it will normally have a different ID (the unpacked
extension ID is a hash of the path on disk). However, this will result in the
auth API not working, since the redirect URL will be different. To force the
unpacked app to have the same ID, add this key and value to `manifest.json`:

    "key": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDth91jxOpPpN5hQFT1uAUJPLwyeOKaqNMBoEF1s7y9aMGsnx4Sxmg+eQsuTdgtJbHfMHYUIAxqvpXvHYCWXQ9gJLOZ7CbZzoRU2SimAOIF8Pro2CjxRMMT1nNA5EAjUR52h94

(this is a base 64 encoded version of the app's public key)

The key *must* be removed before uploading it to the store.

## Resources

* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Window](http://developer.chrome.com/apps/app.window.html)
* [Identity](http://developer.chrome.com/apps/app.identity.html)
