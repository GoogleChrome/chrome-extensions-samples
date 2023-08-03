# chrome.omnibox - Simple Example

This sample demonstrates the `"omnibox"` manifest key and most of the omnibox APIs.

## Overview

The extension uses the `"omnibox"` manifest key and its parameter `"keyword"`. The extension will print logs to the logs page when the omnibox events are triggered.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension's action icon to open the logs page.
4. Type `omnix` in the omnibox and press `Space` to see the suggestions.
5. Try to type something to see how the `onInputChanged` event is triggered.
6. Try to left-click or middle-click on the suggestions to see how the `onInputEntered` event is triggered.
7. Try to remove some suggestions by clicking the `x` icon on the right of the suggestion to see how the `onInputCancelled` event is triggered.
