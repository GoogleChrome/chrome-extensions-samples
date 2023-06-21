# chrome.webNavigation

This sample demonstrates using the webNavigation API to send notifications.

## Overview

The extension calls the `chrome.webNavigation.onCompleted.addListener()` event listener to trigger a notification whenever a the user navigates to a new webpage.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate the web with notifications on.
