# chrome.tabs - Keyboard Pin

A sample that demonstrates how to use the [`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/tabs/) API to toggle the pinned state of the current tab.

## Overview

In this sample, a new keyboard shortcut (Alt + Shift + P) is enabled to pin the current tab.

## Implementation Notes

Chrome fires [`chrome.commands.onCommand`](https://developer.chrome.com/docs/extensions/reference/commands/#event-onCommand) when the user presses a registered keyboard shortcut.

Calls [`chrome.tabs.update()`](https://developer.chrome.com/docs/extensions/reference/tabs/#method-update) to pin or unpin the current tab.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Press Alt + Shift + P to pin the current tab.
