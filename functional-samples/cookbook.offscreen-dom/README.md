This recipe shows how to use DOMParser in an Extension Service Worker using the [Offscreen document][1].

## Context

Extension Service Workers don't have direct access to the DOM. This example demonstrates how to use an
offscreen document for parsing and modifying DOM from an Extension Service Worker. Offscreen documents
and Extension Service Workers exchange data using message passing.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][2].
3. Open the Extension menu and click the extension named "Offscreen API - DOM Parsing".

If you inspect the Extension Service Worker in Chrome DevTools, you can see the result of the DOM transformation in the console view.

[1]: https://developer.chrome.com/docs/extensions/reference/offscreen/
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
