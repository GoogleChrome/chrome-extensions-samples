This recipe shows how to use DOMParser in an Extension Service Worker using the [Offscreen API][1].

## Context

Extension Service Workers don't have direct access to the DOM. This example demonstrates how to use an
offscreen document for parsing and modifying DOM from an Extension Service Worker. Offscreen document
and Extension Service Worker exchange data using message passing.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Open the Extension menu and click the extension named "Offscreen API - DOM Parsing".

If you inspect the Extension Service Worker in Chrome DevTools, you can see thatk

[1]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
