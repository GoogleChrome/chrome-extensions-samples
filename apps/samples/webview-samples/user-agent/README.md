<a target="_blank" href="https://chrome.google.com/webstore/detail/fbkdeonndngdbojbccanjnpnlpdmgchc">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# User Agent Override

Sample that shows how to use the [webview
tag](http://developer.chrome.com/apps/app_external.html#webview) in an app to
create a browser with multiple personalities. The browser [overrides the user
agent
string](https://developer.chrome.com/apps/tags/webview#method-setUserAgentOverride)
for multiple views of the same webpage.

The app's main window contains a series of `<webview>`s that are sized to fit
most of it (via the `width` and `height` attributes). Clicking links, the
navigation control buttons, or entering an address in the location bar
update the `src` attribute of all webviews.

`<webview>` is the preferred way for you to load web content into your
app. It runs in a separate process and has its own storage, ensuring the
security and reliability of your application.

## Resources

* [Webview](http://developer.chrome.com/apps/app_external.html#webview)
* [Permissions](http://developer.chrome.com/apps/manifest.html#permissions)


## Screenshot
![screenshot](/apps/samples/webview-samples/user-agent/assets/screenshot_1280_800.png)
