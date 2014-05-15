# User Agent Override

Sample that shows how to use the [webview
tag](http://developer.chrome.com/apps/app_external.html#webview) in an app to
create a browser with multiple personalities. The browser [overrides the user
agent
string](https://developer.chrome.com/apps/tags/webview#method-setUserAgentOverride)
for multiple views of the same webpage.

The app's main window contains a series of `<webview>`s that are sized to fit
most of it (via the `width` and `height` attributes). Clicking links, the
navigation control buttons, or entering an address in the location bar all
update the to update its `src` attribute of each webview.

`<webview>` is the preferred way for you to load web content into your
app. It runs in a separate process and has its own storage, ensuring the
security and reliability of your application.

## Resources

* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)


## Screenshot
![screenshot](https://raw.github.com/mdittmer/chrome-app-samples/master/user-agent/assets/screenshot_1280_800.png)
