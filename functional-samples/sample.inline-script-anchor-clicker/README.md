# Anchor with inline script clicker sample

## Context

Manifest V3's CSP for content scripts prevents extensions from executing inline JavaScript. Typically inline script execution would occur when an element has inline event handlers bound or when an anchor tag's href attribute contains a `javascript:` scheme. As a result, if an extension tries to call `.click()` on such an element inside an isolated world content script, Chrome will throw a CSP error.

This sample shows how to solve this issue.

Relevant issues: [#807](https://github.com/GoogleChrome/chrome-extensions-samples/issues/807) [#769](https://github.com/GoogleChrome/chrome-extensions-samples/issues/769)

## Try this sample

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension][0].
3. Find the extension named "Anchor Element Clicker" and drag the file `inline-script-demo.html` into your browser. (This extension requires an HTML file opened with the file protocol to inject content script.)

You will find the link `Link Text` will be clicked automatically and the alert dialog will be shown.

[0]: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked
