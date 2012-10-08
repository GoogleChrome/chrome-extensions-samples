# Singleton window

Sample that shows how to use the [window API](http://developer.chrome.com/trunk/apps/appWindow.html) in an app to have a "singleton" window app.

The app keeps track of its window in the background page. If none exists, or if it's closed, it creates a new one. Otherwise it re-focuses the existing one via `chrome.app.window.focus()`.

## APIs

* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
