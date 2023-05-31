# chrome.tabCapture

A sample that demonstrates how to use the [`chrome.tabCapture`](https://developer.chrome.com/docs/extensions/reference/tabCapture/) API.

## Overview

In this sample, the `chrome.tabCapture` API captures the contents of the active tab. The captured stream is displayed in a new window.

## Implementation Notes

To specify capturing specific tabs, [`tabCapture.getMediaStreamId`](https://developer.chrome.com/docs/extensions/reference/tabCapture/#method-getMediaStreamId) is used.

The `targetTabId` and `consumerTabId` are obtained in the Service Worker, and then passed to the receiver page through the [`tabs.sendMessage`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-sendMessage) method.

You can find a more detailed implementation guide on audio recording and screen capture at <https://developer.chrome.com/docs/extensions/mv3/screen_capture/#audio-and-video>.
