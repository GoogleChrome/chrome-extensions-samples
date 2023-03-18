<a target="_blank" href="https://chrome.google.com/webstore/detail/hknlnnbpihcamokfeggmahjgldbcpkof">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# IOIO Bluetooth device

Very simple IOIO client. Tested with [this hardware](http://www.adafruit.com/blog/2012/06/15/new-product-ioio-mint-portable-android-development-kit/)

The constants and information about the protocol was taken from https://github.com/ytai/ioio/wiki/

## Caveats:
* The bluetooth API is only available on dev-channel Chrom(e|ium)OS
* Resource clean-up isn't happening properly yet: you will likely have to disable/enable bluetooth between runs of the program or the connection will fail

## APIs

* [Bluetooth](http://developer.chrome.com/apps/bluetooth)

## Screenshot
![screenshot](/_archive/apps/samples/ioio/assets/screenshot_1280_800.png)

