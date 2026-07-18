# Chrome extension WebSocket example

This example demonstrates how to use WebSockets in a MV3 Chrome Extension. Starting with Chrome version M116, WebSocket
activity will extend the service worker lifetime. In previous Chrome versions, the service worker will become inactive
while waiting for messages and disconnect the WebSocket.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension from the extension menu.
4. Click the extension's action icon to start a web socket connection.
5. Click the extension's action again to stop the web socket connection.
6. Check the [service worker status](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/#sw-status) to see when the service worker is active/inactive.
