<a target="_blank" href="https://chrome.google.com/webstore/detail/kpgjodoohleggakakpaadgjeedfgeafi">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# New Window API

Sample that shows how to use the [New Window
API](https://developer.chrome.com/apps/tags/webview#event-newwindow) for
[webviews](http://developer.chrome.com/apps/app_external.html#webview). The
app behaves like a tabbed browser. When actions in we webview request a new
tab or window, the browser responds appropriately. For example, clicking
links with a foreign target opens a new tab in the foreground; ctrl+clicking
a link opens a new tab in the background; Javascript calls to `window.open()`
that identify a different window open a new window.

## Features

* Shortcut keys: `Ctrl+t` (new tab), `Ctrl+W` (close tab), `Ctrl + [1-9]` (select tab)
* Popup confirmation: An attempt to open a separate window (not a separate
  tab in the same window) must be explicitly allowed by the user (see
  screenshot for example of Allow/Deny dilaogue)

## Limitations

* Managing of named windows and setting of new window attributes is not
  supported. Attempting to open two links in a window named `foo` will not
  navigate the same window twice. Attributes (e.g., width, height, resizable)
  to `window.open()` will be ignored.

## Resources

* [Webview New Window API](https://developer.chrome.com/apps/tags/webview#event-newwindow)
* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)


## Screenshot
![screenshot](/apps/samples/webview-samples/new-window/assets/screenshot_1280_800.png)
