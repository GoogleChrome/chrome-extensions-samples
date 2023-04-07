<a target="_blank" href="https://chrome.google.com/webstore/detail/bdiclhdalonemjdeeaglackjgdboboem">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Arduino LED toggle

Note: on Mac OS X Lion, it's necessary to update USB Serial drivers:
https://web.archive.org/web/20160630184514/http://blog.geekscape.org/wordpress/2011/07/22/mac-os-x-17-lion-upgrading-ftdi-usb-serial-dr

This sample shows a big button that lets you toggle between the on/off
state of an LED connected to an Arduino.

1. Install the LED sketch on your Duo.
2. Attach a LED to pin 2 (with a resistor to not burn it out).
3. Install and launch this packaged app.
4. Press the button to toggle the LED.

Future version: use the standard Firmata sketch and build a JS firmata driver
for Chrome packaged apps.

## APIs

* [Serial API](http://developer.chrome.com/apps/app.hardware.html#serial)
* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)

## Screenshot
![screenshot](/_archive/apps/samples/serial/ledtoggle/assets/screenshot_1280_800.png)
