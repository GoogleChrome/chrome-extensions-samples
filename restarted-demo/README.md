# onRestarted event

When an app is restored after being unexpectedly terminated (eg, when the browser restarts) it will be sent an onRestarted event which should restore the app to the state it was in when it was last running.

This demo app creates a new counter on launch and restores any existing counters across app restarts.


## APIs

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Storage](http://developer.chrome.com/trunk/apps/storage.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
