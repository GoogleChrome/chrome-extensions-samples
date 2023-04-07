<a target="_blank" href="https://chrome.google.com/webstore/detail/laolmfhjaobpboigjfbclcphckmjodlp">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# GitHub Auth

A sample application that uses the
[Identity API](https://developer.chrome.com/apps/identity) to
request identification information about the user's GitHub account. After user
logs on to GitHub and authorizes the application to use their information, both
users name and email address (if available) will be displayed.

This app uses the launchWebAuthFlow flow of the Identity API, which is enabling
authorization with providers other than Google. For autorization using Google
Account check out the [Identity sample application](../identity).

## APIs

* [Identity](https://developer.chrome.com/apps/identity)
* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)


## Screenshot
![screenshot](/_archive/apps/samples/github-auth/assets/screenshot_1280_800.png)

