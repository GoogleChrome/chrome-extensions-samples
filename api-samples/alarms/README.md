# chrome.browsingData

This sample demonstrates using the `chrome.alarms` API to allow the user to set alarms using an extension page.

## Overview

The extension uses `chrome.alarms.create()` to set an initial alarm that is displated on the extension page. More alarms can be set with user input.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button and interact with the UI.
