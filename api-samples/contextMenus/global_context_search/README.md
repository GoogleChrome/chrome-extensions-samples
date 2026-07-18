# chrome.contextMenus

This sample demonstrates the `chrome.contextMenus` API by letting a user switch between searching different countries' versions of Google via a `contextMenu`.

## Overview

The extension uses `chrome.contextMenus.create()` to populate the context menu with locale options based on an options menu in the popup. A `chrome.contextMenus.onClicked.addListener()` event will open a specific locale's Google homepage when one of the extension's context menu options are clicked.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button and interact with the UI.
5. Select the text you want to search and right-click within the selection to view and interact with the context menu.
