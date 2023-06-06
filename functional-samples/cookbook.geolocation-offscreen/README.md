This recipe shows how to get `geolocation` access within a service worker

## Context

In extensions, geolocation uses the same web APIs you are used to. Instead, if you want to get geolocation information, use the same [`navigator.geolocation`](geolocation) DOM API that any web site normally would. This demo shows how to access this data in a Service Worker (via [offscreenDocument][2]. We also have samples for a [popup][3], or a [content script][4]

## Running this extension

1. Clone this repository.
1. Load this directory in Chrome as an [unpacked extension][2].
1. Open the Extension menu and click the extension named "Geolocation - offscreen".

[1]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
[2]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[3]: functional-samples/cookbook.geolocation-popup
[4]: functional-samples/cookbook.geolocation-contentscript
