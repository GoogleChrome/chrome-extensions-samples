# chrome.contentSettings

This sample demonstrates using `chrome.contentSettings` to display the settings of a given page in the extension's popup.

## Overview

The extension calls `chrome.contentSettings.get()` and `chrome.contentSettings.set()` to manage the value of each content setting on the user's currently active tab.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extenion to the browser's taskbar and click on the popup to see the content settings for a given site.
