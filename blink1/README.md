# Blink(1)

This sample demos the `chrome.hid` API by controlling a [blink(1) mk2](http://blink1mk2.thingm.com/) RGB LED light.

## APIs

* [HID](https://developer.chrome.com/apps/hid)
* [Runtime](https://developer.chrome.com/apps/app_runtime)
* [Window](https://developer.chrome.com/apps/app_window)
     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/blink1/assets/screenshot_1280_800.png)

## Running this app on Linux

On Linux a udev rule must be added to allow Chrome to open the blink(1) device. Copy the file `udev/61-blink1.rules` to `/etc/udev/rules.d`. It contains the following text which causes the `hidraw` device node for this device to be given `0666` permissions:

    # Make the blink(1) accessible to all via hidraw.
    SUBSYSTEM=="hidraw", SUBSYSTEMS=="usb", ATTRS{idVendor}=="27b8", ATTRS{idProduct}=="01ed", MODE="0666"

