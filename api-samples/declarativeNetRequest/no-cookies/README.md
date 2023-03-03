# chrome.declarativeNetRequest - No Cookies

This sample demonstrates using the [`chrome.declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API to remove the "Cookie" header from requests.

## Overview

Once this extension is installed, any main frame requests ending in `?no-cookies=1` will be sent without the "Cookie" header.

For example, install this extension and try navigating to https://github.com/GoogleChrome/chrome-extensions-samples?no-cookies=1. You should appear signed out.

## Implementation Notes

This sample uses the `chrome.declarativeNetRequest.onRuleMatchedDebug` event which is only available in unpacked extensions.
