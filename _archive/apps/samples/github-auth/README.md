<a target="_blank" href="https://chrome.google.com/webstore/detail/laolmfhjaobpboigjfbclcphckmjodlp">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# GitHub Auth

A sample application that uses the
[Identity API](https://developer.chrome.com/apps/identity.html) to
request identification information about the user's GitHub account. After user
logs on to GitHub and authorizes the application to use their information, both
users name and email address (if available) will be displayed.

This app uses the launchWebAuthFlow flow of the Identity API, which is enabling
authorization with providers other than Google. For autorization using Google
Account check out the [Identity sample application](../identity).

## APIs

* [Identity](https://developer.chrome.com/apps/identity.html)
* [Runtime](https://developer.chrome.com/apps/app.runtime.html)
* [Window](https://developer.chrome.com/apps/app.window.html)

     
## Screenshot
![screenshot](/apps/samples/github-auth/assets/screenshot_1280_800.png)

