# chrome.debugger

This sample demonstrates using the [`chrome.debugger`](https://developer.chrome.com/docs/extensions/reference/debugger/) API to capture network events on webpages.

## Overview

The extension calls `chrome.debugger.attach()` on a tab to capture network events when you click the extension's action button. The response data is logged in the developer console, to demonstrate extracting a network response's data such as the request headers and URL.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate to an HTTP/HTTPS webpage and open the devtools window.
4. Pin the extension to the browser's taskbar and click on the action button to see the network event data logged to the console.
