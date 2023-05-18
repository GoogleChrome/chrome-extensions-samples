# **Sample CO₂ Meter Chrome Extension**

The extension uses [WebHID](https://developer.chrome.com/en/articles/hid/) to access a device for measuring the CO₂ level and temperature in your surroundings, and then stores the data in your browser's local storage for historical readings.

## **Testing the extension**

1. Follow the instructions to load an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
2. Connect the CO₂ meter (currently it only supports the [CO2Mini Indoor Air Quality Monitor](https://www.co2meter.com/products/co2mini-co2-indoor-air-quality-monitor) from CO2Meter.com).
3. Open the extension popup window and click “Large Chart and Settings” button to go to the settings page.
4. Click the “Grant CO2 meter permission” button and grant the permission to the CO₂ meter.

Following the above steps, the device connection session to the CO₂ meter will be created when the extension is running. The input reports from the device will be processed and stored in the storage. The CO₂ meter reading chart will be updated at regular intervals, as specified in the "Chart refresh interval (in seconds)" field on the settings page, and will be displayed in the chart in both the pop-up window and the larger chart settings page.

## **Additional instructions**

- After changing the "Chart refresh interval (in seconds):" setting, please reload the extension to get the extension using the latest interval.

## **WebHID limitations in extension service workers**

WebHID will be officially available to extension service workers in Chrome 115. Before M115, it can be enabled through the flag chrome://flags#enable-web-hid-on-extension-service-worker. However, there are limitations to the support for WebHID in extension service workers:

- Before M115 with flag enabled, if the service worker is idle for longer than [30 seconds](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/public/mojom/service_worker/service_worker.mojom;l=150;drc=ff468ef351dc107e9bb92635914e3908d763cf29) it may be terminated, closing the device connection session. This limitation will be resolved in M115.
- Device connection events are not fired if the device is plugged or unplugged while the service worker is inactive. We have [crbug.com/1446487](http://crbug.com/1446487) to track the resolution of this limitation. If your extension encounters issues because of this limitation, please leave a comment in the bug about your use case and how the limitation affects your extension.
