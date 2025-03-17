<a target="_blank" href="https://chrome.google.com/webstore/detail/oficlfehfenioickohognhdhmmcpceil">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Identity

A sample extension that uses the
[Identity API](https://developer.chrome.com/apps/identity.html) to
request information of the logged in user and present this info on the screen.
If the user has a profile picture, their profile image is also fetched and
shown it in the app.

This extension uses the getAuthToken flow of the Identity API, so it only
works with Google accounts. If you want to identify the user in a non-Google
OAuth2 flow, you should use the launchWebAuthFlow method instead.

## APIs

* [Identity](http://developer.chrome.com/apps/app_identity.html)
* [Runtime](https://developer.chrome.com/docs/extensions/reference/api/runtime)


## Screenshot
![screenshot](/apps/samples/identity/assets/screenshot_1280_800.png)
