# chrome.tabs - Tab zoom

A sample that demonstrates how to use the zoom features of the [`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/tabs/) API.

## Overview

In this sample, the zoom related [`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/tabs/) APIs are used to change the magnification and zoom mode of the active tab.

## Implementation Notes

- [`chrome.tabs.getZoom()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-getZoom) returns the current zoom level of the tab.
- [`chrome.tabs.setZoom()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-setZoom) changes the zoom level of the tab.
- [`chrome.tabs.setZoomSettings()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-setZoomSettings) sets the zoom settings of the tab.
- [`chrome.tabs.getZoomSettings()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-getZoomSettings) returns the zoom settings of the tab.
- [`chrome.tabs.onZoomChange()`](https://developer.chrome.com/docs/extensions/reference/tabs/#event-onZoomChange) listens for zoom changes in the tab.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Open any website, such as `https://google.com` in a new tab, and then click the extension icon to open the popup.
