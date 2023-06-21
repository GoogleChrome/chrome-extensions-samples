# chrome.bookmarks

This sample demonstrates using the `chrome.bookmarks` API to search through, add, and delete bookmarks from the user's bookmark tree.

## Overview

The full bookmark tree is displayed on the extension popup usin `chrome.bookmarks.getTree`.
`chrome.bookmarks.create`is used to add 'https://www.google.com/' to the user's bookmarks. The `chrome.bookmarks.remove` and `chrome.bookmarks.search` APIs are used to find and delete any bookmarks that match 'https://www.google.com/'.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar and open up the popup by clicking the action button.
4. Experiment with adding and removing bookmarks using the buttons within the popup.
