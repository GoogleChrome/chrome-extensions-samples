# geolocation inside a popup

This recipe shows how to get `geolocation` access within a popup

## Overview

To get geolocation information in extensions, use the same [`navigator.geolocation`][6] DOM API that any website normally would.This demo shows how to access this data in a [popup][3]. We also have demos for a [Service Worker][5](via [offscreen document][2]), and using a [content script][4]

## Running this extension

1. Clone this repository.
1. Load this directory in Chrome as an [unpacked extension][2].
1. Open the Extension menu and click the extension named "Geolocation - popup".

[1]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
[2]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[3]: /functional-samples/cookbook.geolocation-popup
[4]: /functional-samples/cookbook.geolocation-contentscript
[5]: /functional-samples/cookbook.geolocation-offscreen
[6]: https://developer.mozilla.org/docs/Web/API/Navigator/geolocation
