<a target="_blank" href="https://chrome.google.com/webstore/detail/oficlfehfenioickohognhdhmmcpceil">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Identity

A sample application that uses the
[Identity API](https://developer.chrome.com/apps/identity.html) to
request information of the logged in user and present this info on the screen.
If the user has a profile picture, an XMLHttpRequest request is also sent to
grab the image and show it in the app.

This app uses the getAuthToken flow of the Identity API, so it only works with
Google accounts. If you want to identify the user in a non-Google OAuth2 flow,
you should use the launchWebAuthFlow method instead.

## APIs

* [Identity](https://developer.chrome.com/docs/apps/app_identity/)
* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)


## Screenshot
![screenshot](/_archive/apps/samples/identity/assets/screenshot_1280_800.png)
