<a target="_blank" href="https://chrome.google.com/webstore/detail/kcpjgiicabigbjejdjnkflkdkjknkdch">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Blink(1)

This sample demos the `chrome.hid` API by controlling a [ThingM blink(1) mk2](http://blink1mk2.thingm.com/) RGB LED light via USB HID Feature Reports.

## APIs

* [HID](https://developer.chrome.com/apps/hid)
* [Runtime](https://developer.chrome.com/apps/app_runtime)
* [Window](https://developer.chrome.com/apps/app_window)

## Running this app on Linux

On Linux a udev rule must be added to allow Chrome to open the blink(1) device. Copy the file [`udev/61-blink1.rules`](https://raw.githubusercontent.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/samples/blink1/udev/61-blink1.rules) to `/etc/udev/rules.d`. It contains the following rule which allows anyone in the `plugdev` group read/write access the `hidraw` node for this device. See [USB Caveats](https://developer.chrome.com/apps/app_usb#caveats) for more details.

    # Make the blink(1) accessible to plugdev via hidraw.
    SUBSYSTEM=="hidraw", SUBSYSTEMS=="usb", ATTRS{idVendor}=="27b8", ATTRS{idProduct}=="01ed", MODE="0660", GROUP="plugdev"

## Screenshot
![screenshot](/_archive/apps/samples/blink1/assets/screenshot_1280_800.png)
