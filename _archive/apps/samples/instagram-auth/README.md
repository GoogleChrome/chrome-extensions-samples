<a target="_blank" href="https://chrome.google.com/webstore/detail/baaenjnmlaejajnalldcecpdafeggelb">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Instagram Demo

This is a basic Instagram client implemented as a packaged app.  This demonstration simply displays the users logged-in view as raw JSON.

To log into Instagram, it uses the [identity API](http://developer.chrome.com/apps/identity.html) (specfically, the `launchWebAuthFlow` method). Once it gets the OAuth token it makes a request to an authenticated endpoint to get the JSON feed of the user's view.

When running it unpacked, it will normally have a different ID (the unpacked
extension ID is a hash of the path on disk). However, this will result in the
auth API not working, since the redirect URL will be different. To force the
unpacked app to have the same ID, add this key and value to `manifest.json`:

    "key": "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCM9NA1cLHYrp+htpkHWHmXKAXja/DNfyrSb2mkvfGRT/JVxbPDXJqeRXwhqwYpxgNxMxcD8skIqSy6zHWqtymzjqyFVbMg4ox7qyLC7dEMdx0TgstYjtC3KjEZNM7VM0gRlReJoQuSM/GSIGnAlUjP7Ahd1XF16JgZPICSoeFiTQIDAQAB",

(this is a base 64 encoded version of the app's public key)

The key *must* be removed before uploading it to the store.

## Resources

* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)
* [Identity](https://developer.chrome.com/docs/apps/app_identity/)


## Screenshot
![screenshot](/_archive/apps/samples/instagram-auth/assets/screenshot_1280_800.png)
