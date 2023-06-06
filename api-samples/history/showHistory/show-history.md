# chrome.history

This sample demonstrates using the `chrome.history` API to display the user's most visited pages in the extension popup.

## Overview

This extension makes use of the `chrome.history.search` API to scrape the browser's history and count occurances of each visited URL.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the browser's taskbar.
4. Click on the extension's action button to view your most visited pages.
