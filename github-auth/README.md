# GitHub Auth

A sample application that uses the
[Identity API](https://developer.chrome.com/trunk/apps/identity.html) to
request identification information about the user's GitHub account. After user
logs on to GitHub and authorizes the application to use their information, both
users name and email address (if available) will be displayed.

This app uses the launchWebAuthFlow flow of the Identity API, which is enabling
authorization with providers other than Google. For autorization using Google
Account check out the [Identity sample application](https://github.com/GoogleChrome/chrome-app-samples/tree/master/identity).

## APIs

* [Identity](https://developer.chrome.com/trunk/apps/identity.html)
* [Runtime](https://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](https://developer.chrome.com/trunk/apps/app.window.html)

     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/github-auth/assets/screenshot_1280_800.png)

