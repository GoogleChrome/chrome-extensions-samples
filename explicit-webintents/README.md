# Explicit WebIntents

This sample shows how two apps ("ping" and "pong") can communicate via explicit web intents without direct user involvement.

Install both "ping" and "pong". Launch either app, and press the "Dispatch intent" button. The other app will be launched (if it's not running already), and the intent data will be delivered to its background page via the `onLaunched` event (and then in turn to its window). The other app will reply, and the reply will be displayed in the window of the app that sent the intent.

## APIs

* [WebIntents](http://developer.chrome.com/apps/app_intents.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

