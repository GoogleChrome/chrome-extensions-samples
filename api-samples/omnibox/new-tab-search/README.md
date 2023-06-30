# chrome.omnibox

This sample demonstrates the `"omnibox"` manifest key and API by creating a keyword that opens up a browser search in a new tab.

## Overview

The extension uses the `"omnibox"` manifest key and its parameter `"keyword"`. When `chrome.omnibox.onInputEntered.addListener()` is called and the keyword 'newTab' is used, a new tab is opened with a google search for the user's input text.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Type 'newTab' and some text you wish to google within the browser omnibox.
