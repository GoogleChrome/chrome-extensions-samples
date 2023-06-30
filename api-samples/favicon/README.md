# favicon

This sample demonstrates the favicon manifest permission by displaying the favicon of a url in the extension popup.

## Overview

The extension calls `chrome.runtime.getURL('/_favicon/')` to create a fully-qualified URL pointing to the "\_favicon/" folder. Then it returns a new string representing the URL with several query parameters. Finally, the extension appends the image to the body of the extension popup.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Pin the extension to the taskbar to access the action button.
4. Open the extension popup by clicking the action button.
