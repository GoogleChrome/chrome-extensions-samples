# Griffin PowerMate knob

This demo interfaces with a [Griffin PowerMate](http://en.wikipedia.org/wiki/Griffin_PowerMate) device, reading its position and displaying it via a Chrome logo. It does not currently work on Mac OS X, since on that platform the OS claims the PowerMate is an HID device, and does not allow raw USB access to it.

## APIs

* [USB raw access](http://developer.chrome.com/trunk/apps/app_hardware.html#usb)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
