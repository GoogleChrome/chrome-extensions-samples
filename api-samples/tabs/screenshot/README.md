# chrome.tabs - Tab Screenshot

A sample that demonstrates how to use the [`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/tabs/) API to take a screenshot of the current tab.

## Overview

When the user clicks the action icon, the extension takes a screenshot of the current tab and displays it in a new tab.

## Implementation Notes

Calls [`chrome.tabs.captureVisibleTab()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-captureVisibleTab) to capture the visible area of the current tab.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension's icon to take a screenshot of the current tab.
