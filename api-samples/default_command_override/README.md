# chrome.commands

This sample demonstrates the `chrome.commands` API by creating a new keyboard macro for switching tabs in the browser window.

## Overview

The extension sets Ctrl+Shift+Left and Ctrl+Shift+Right as command inputs in the manifest, and uses `chrome.commands.onCommand.addListener()` to trigger switching tabs.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Input the keyboard commands to switch between tabs.
