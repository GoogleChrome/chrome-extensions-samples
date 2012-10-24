# Zephyr heart rate monitor device

Very simple Zephyr HXM heart rate monitor driver. This sample uses the bluetooth API to fetch heart rate data from a Zephyr HXM device

## Caveats:
- The bluetooth API is only available on dev-channel Chrom(e|ium)OS
- Resource clean-up isn't happening properly yet: you will likely have to disable/enable bluetooth between runs of the program or the connection will fail

## APIs

* [Bluetooth](http://developer.chrome.com/apps/bluetooth.html)
* [Sandboxed iframe](http://developer.chrome.com/apps/app_external.html#sandboxing)


## Third-party libs

* http://www.highcharts.com/ to display the data inside of a sandboxed iframe
