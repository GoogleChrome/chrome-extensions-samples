<a target="_blank" href="https://chrome.google.com/webstore/detail/ljngdccbopfaompkjfhepllagnijbdne">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# onRestarted event

When an app is restored after being unexpectedly terminated (eg, when the browser restarts) it will be sent an onRestarted event which should restore the app to the state it was in when it was last running.

This demo app creates a new counter on launch and restores any existing counters across app restarts.


## APIs

* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Storage](http://developer.chrome.com/apps/storage.html)
* [Window](http://developer.chrome.com/apps/app.window.html)
     
## Screenshot
![screenshot](/apps/samples/restarted-demo/assets/screenshot_1280_800.png)

