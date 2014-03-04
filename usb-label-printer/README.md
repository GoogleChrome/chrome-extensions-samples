<a target="_blank" href="https://chrome.google.com/webstore/detail/fgnncpfphbgfchijmoopegkdhihegfla">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


label-printer-app
=================

Chrome packaged app for a simple label generator with printer support for Dymo 450 LabelWriter.

Code originally created by Marjin Kruisselbrink (@mkruisselbrink).

### Other printers

If you want to reuse this code for other LabelWriter printers, you might be able to do it if they use the same protocol.

For example, for Dymo 450 Turbo, you need to change:

- index.js
<pre>
var productId = 0x0021; // changed from 0x0020
</pre>

- manifest.json
<pre>
"optional_permissions": [ {"usbDevices": [{"vendorId": 2338, "productId": 33}]}] // changed from 32
</pre>

(thanks @kjantzer for the [information](https://github.com/GoogleChrome/chrome-app-samples/issues/126#issuecomment-29547981))

### Windows issues

Windows users may encounter problems when trying to findDevice or openDevice.
You might give a try to zadig drivers, they are generic low level usb drivers in replacement for vendor specific ones.
[http://zadig.akeo.ie/](http://zadig.akeo.ie/ "Zadig drivers website")

LICENSE
=======

Copyright 2013 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/usb-label-printer/assets/screenshot_1280_800.png)

