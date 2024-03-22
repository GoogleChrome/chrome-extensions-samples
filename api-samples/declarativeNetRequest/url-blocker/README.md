# chrome.declarativeNetRequest - URL Blocker

This sample demonstrates using the [`chrome.declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API to block requests.

## Overview

Once this extension is installed, any requests made in the main frame to example.com will be blocked.

## Implementation Notes

This sample uses the `chrome.declarativeNetRequest.onRuleMatchedDebug` event which is only available in unpacked extensions.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Select and open the extension from the extensions menu.
4. To test the extension, click on 'Sample minute' to set an alarm of 1 minute, post which a notification appears in the system tray.
