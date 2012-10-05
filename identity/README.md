# Identity

A sample application that uses the Identity API to request identification information of the logged in user and present this info on the screen. If the user has a profile picture, a XMLHttpRequest2 request is also sent to grab the image and show it in the app.

This app uses the getAuthToken flow of the Identity API, so it only works with Google accounts. If you want to identify the user in a non-Google OAuth2 flow, you should use the launchWebAuthFlow method instead.

## APIs

* [Identity](http://developer.chrome.com/trunk/apps/app.identity.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

