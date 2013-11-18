<a target="_blank" href="https://chrome.google.com/webstore/detail/amimibkjbhghkicjojoapmhdpmklooen">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Singleton window

Sample that shows how to use the [window API](http://developer.chrome.com/apps/appWindow.html) in an app to have a "singleton" window app.

The app keeps track of its window in the background page. If none exists, or if it's closed, it creates a new one. Otherwise it re-focuses the existing one via `chrome.app.window.focus()`.

## APIs

* [Window](http://developer.chrome.com/apps/app.window.html)
     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/singleton/assets/screenshot_1280_800.png)

