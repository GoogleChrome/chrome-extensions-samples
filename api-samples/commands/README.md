# chrome.commands

This sample demonstrates the [`chrome.commands`](https://developer.chrome.com/docs/extensions/reference/api/commands) API by defining custom keyboard shortcuts and responding to command events.

## Overview

The extension registers two custom keyboard shortcuts in the manifest and listens for them using `chrome.commands.onCommand`. One command shows a notification, the other toggles a feature on and off with badge text feedback. The popup uses `chrome.commands.getAll()` to display all registered shortcuts and their current key bindings.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Use the keyboard shortcuts shown in the popup or customize them at `chrome://extensions/shortcuts`.
