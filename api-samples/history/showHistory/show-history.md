# chrome.history

This sample uses the [`chrome.history`](https://developer.chrome.com/docs/extensions/reference/history/) API to display in a popup the user's most visited pages.

## Overview

This extension calls `chrome.history.search()` to scrape the browser's history and count occurrences of each visited URL.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the browser's taskbar.
4. Click on the extension's action button to view your most visited pages.
