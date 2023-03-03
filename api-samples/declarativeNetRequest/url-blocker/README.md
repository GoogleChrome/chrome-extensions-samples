# chrome.declarativeNetRequest - URL Blocker

This sample demonstrates using the [`chrome.declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API to block requests.

## Overview

Once this extension is installed, any requests made in the main frame to example.com will be blocked.

## Implementation Notes

This sample uses the `chrome.declarativeNetRequest.onRuleMatchedDebug` event which is only available in unpacked extensions.
