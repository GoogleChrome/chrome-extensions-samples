# chrome.idle

This sample demonstrates how to use the [`chrome.idle`](https://developer.chrome.com/docs/extensions/reference/idle/) API.

## Overview

In this sample, the `chrome.idle` API detects and stores the history of the user's idle state.

## Implementation Notes

The detection interval of [`chrome.idle.onStateChanged`](https://developer.chrome.com/docs/extensions/reference/idle/#event-onStateChanged) event needs to be modified using the [`chrome.idle.setDetectionInterval`](https://developer.chrome.com/docs/extensions/reference/idle/#method-setDetectionInterval) method.

The idle state history is stored in the [`chrome.storage.session`](https://developer.chrome.com/docs/extensions/reference/storage/#property-session) storage area.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension's action icon to open the window.
