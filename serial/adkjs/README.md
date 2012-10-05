# ADK kit in Javascript

This demo is composed of two parts and require a ADK 1.0 hardware (Arduino board+shield shipped at Google I/O 2011) to demonstrate Android hardware integration.

The demo simulates the same visual interface of the Android application, but in HTML5. There are UI widgets to control the servo motors, led lights and relays, and it gets sensors and buttons events.

In the firmware directory, there is the Arduino app you must upload. We could not use exactly the same arduino code from the original Android ADK because it uses a USB port where the board is the USB host, and that woudl conflict with the computer USB port that is always the host. Upload the arduino firmware code to the board and you are set.

In the app directory, you will find the Chrome Packaged App. 

## APIs

* [Serial API](http://developer.chrome.com/trunk/apps/app.hardware.html#serial)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
