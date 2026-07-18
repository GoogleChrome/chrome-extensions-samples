# chrome.tabCapture recorder

This sample demonstrates how to use the [`chrome.tabCapture`](https://developer.chrome.com/docs/extensions/reference/tabCapture/) API to record in the background, using a service worker and [offscreen document](https://developer.chrome.com/docs/extensions/reference/offscreen/).

## Overview

In this sample, clicking the action button starts recording the current tab in an offscreen document. After 30 seconds, or once the action button is clicked again, the recording ends and is saved as a download.

## Implementation Notes

See the [Audio recording and screen capture guide](https://developer.chrome.com/docs/extensions/mv3/screen_capture/#audio-and-video-offscreen-doc) for more implementation details.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension from the extension menu.
4. Click the extension's action icon to start recording.
5. Click the extension's action again to stop recording.
