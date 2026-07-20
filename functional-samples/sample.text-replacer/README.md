# Text Replacer

This sample demonstrates how an extension can replace text on a page in response to user invocation.

## Overview

Users can use the extension's popup to define up to 5 pairs of text replacements. Text is replaced when the user clicks the "Replace" button in the popup, when they select the "Replace text" context menu option on a page, or when they use the extension's keyboard shortcut (command).

## Compatibility

`"minimum_chrome_version"` is set to 148 because that version adds support for returning a promise from an `onMessage` event handler ([docs](https://developer.chrome.com/docs/extensions/develop/concepts/messaging#:~:text=call%20it%20later.-,Return%20a%20promise,-From%20Chrome%20148)) to respond to a message asynchronously.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate to any page (make sure that the URL doesn't start with `chrome://`).
4. Click the extension icon.
