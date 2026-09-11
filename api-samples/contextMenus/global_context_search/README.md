# chrome.contextMenus

This sample demonstrates the `chrome.contextMenus` API by letting a user search selected text with Google results restricted to a chosen country via a `contextMenu`.

## Overview

The extension uses `chrome.contextMenus.create()` to populate the context menu with country options based on the popup settings. A `chrome.contextMenus.onClicked.addListener()` event opens Google Search with a country restriction when one of the extension's context menu options is clicked.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button and interact with the UI.
5. Select the text you want to search and right-click within the selection to view and interact with the context menu.
