# chrome.tabCapture

A sample that demonstrates how to use the [`chrome.tabCapture`](https://developer.chrome.com/docs/extensions/reference/tabCapture/) API.

## Overview

In this sample, the `chrome.tabCapture` API captures the contents of the active tab. The captured stream is displayed in a new window.

## Implementation Notes

Call [`tabCapture.getMediaStreamId()`](https://developer.chrome.com/docs/extensions/reference/tabCapture/#method-getMediaStreamId) to capture specific tabs.

The `targetTabId` and `consumerTabId` are obtained in the Service Worker, and then passed to the receiver page through the [`tabs.sendMessage()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage) method.

See the [Audio recording and screen capture guide](https://developer.chrome.com/docs/extensions/mv3/screen_capture/#audio-and-video) for a more detailed implementation.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension's action icon.
