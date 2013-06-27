# GitHub Auth

A sample application that uses the Identity API to request identification
information about the user's Git Hub account. After user logs on to GitHub and
authorizes the application to use their information, both users name and email
address (if available) will be displayed.

This app uses the launchWebAuthFlow flow of the Identity API, which is enabling
authorization with providers other than Google. For autorization using Google
Account check out the Identity sample application.

## APIs

* [Identity](http://developer.chrome.com/trunk/apps/app.identity.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

