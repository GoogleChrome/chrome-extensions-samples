# Clicker Example for Element with Inline Script

## Overview

Manifest V3's CSP for content scripts prevents extensions from executing inline JavaScript. Typically inline script execution would occur when an element has inline event handlers bound or when an anchor's href attribute contains a `javascript:` scheme. As a result, if an extension tries to call `.click()` on such an element inside an isolated world content script, Chrome will throw a CSP error.

This sample shows how to solve this issue.

Relevant issues: [#807](https://github.com/GoogleChrome/chrome-extensions-samples/issues/807) [#769](https://github.com/GoogleChrome/chrome-extensions-samples/issues/769)

## Try this sample

1. Clone this repository.
2. Load this directory in Chrome as an unpacked extension.
3. Find the extension named "Anchor Element Clicker" and drag the file `inline-script-demo.html` into your browser. (This extension requires an HTML file opened with the file protocol to inject content script.)

You will find the link `Link Text` will be clicked automatically, and a alert dialog with the text `Clicked` will be shown.

## Implementation Notes

To achieve clicking on a element with an inline event handler or a link with a javascript: scheme in an isolated script and bypassing CSP, the following steps should be taken:

1. Inject a main world script where scripts are not subject to extension CSP restrictions. This script needs to listen for an event named `proxy-click`.

2. In the isolated script, dispatch a `proxy-click` event and pass the element to be clicked to the main world script through the `relatedTarget` field of the `MouseEvent`.

3. Once the main world script receives the event, it clicks on the corresponding element.
