# chrome.notifications

This sample demonstrates the creation of, and interaction with, each of the notification template types.

## Overview

The sample uses `chrome.notification.create` to cycle through creating notifications of different types. The `chrome.notifications.onClicked` event listener is used to allow the user to interact with the notifications to cycle through creating new template types.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Make sure notifications are set to on.
4. Click the extension's action button to create a notification to interact with.
