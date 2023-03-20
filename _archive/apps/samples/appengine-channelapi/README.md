<a target="_blank" href="https://chrome.google.com/webstore/detail/alieplnmdkoekpkepkfgickpmhhabfkl">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>



# AppEngine Channel API example

This is an example of how to use the AppEngine's Channel API in a Chrome Packaged App. Since the Channel API is not directly compatible with the CSP restrictions in a packaged app, this sample uses a WebView and a "proxy" object that communicates with the Webview using async postMessage.

This code is an adaptation of the [Tic Tac Toe game](https://code.google.com/p/channel-tac-toe/) used by the AppEngine team to demonstrate the Channel API. The main modifications from the original game are:

- index.html is not rendered as a template in the server, it is embedded in the app. All responses from the server are JSON messages;
- the server doesn't use the appengine's user library, since that would require another authentication step. Instead, the server attributes a random UUID to the first user and another to the second. This user ID is returned to the client that uses it in the following calls. It is not secure, but simple enough for this sample. In a real application, this method would allow an eaversdropper to capture the GET request and replay with different commands;
- all the interations with the channel API are abstracted in the ChannelAPI object defined by channel_in_a_webview.js. This object communicates with the webview page (channel_in_a_webview.html), served to the webview from the appengine server.

To run:

- go to the `appengine` folder and type `dev_appserver.py .`
- install the Chrome Packaged App in the `app` folder
- run the Chrome packaged app twice and copy the game ID from one screen to the other
- play

* [Appengine Channel API](https://developers.google.com/appengine/docs/python/channel)
* [Webview](https://developer.chrome.com/apps/tags/webview)


## Screenshot
![screenshot](/_archive/apps/samples/appengine_channelapi/app/assets/screenshot_1280_800.png)

