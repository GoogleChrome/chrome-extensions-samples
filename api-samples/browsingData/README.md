# chrome.browsingData

This sample demonstrates using the `chrome.browsingData` API to clear the user's history without having to visit the history page.

## Overview

Elements on the extension popup are used to take in user input, and `chrome.browsingData.remove` is implemented to delete the user's history.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button and interact with the UI. Caution: This extension deletes your browser history.
