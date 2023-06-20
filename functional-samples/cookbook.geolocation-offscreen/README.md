# geolocation via offscreen document

This recipe shows how to get `geolocation` access within a service worker

## Overview

To get geolocation information in extensions, use the same [`navigator.geolocation`][6] DOM API that any website normally would. This demo shows how to access this data in a Service Worker (via [offscreen document][2]). We also have samples for a [popup][3], or a [content script][4].

## Running this extension

1. Clone this repository.
1. Load this directory in Chrome as an [unpacked extension][1].
1. Open the Extension menu and click the extension named "Geolocation - offscreen".
1. Click on the extension's icon to request the location. You can see it by hovering over the icon.
1. Alternatively, you can open the console for service_worker.js, and call getGeolocation directly.

[1]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
[2]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[3]: /functional-samples/cookbook.geolocation-popup
[4]: /functional-samples/cookbook.geolocation-contentscript
[6]: https://developer.mozilla.org/docs/Web/API/Navigator/geolocation
