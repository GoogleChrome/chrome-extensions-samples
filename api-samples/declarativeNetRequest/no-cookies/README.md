# chrome.declarativeNetRequest - No Cookies

This sample demonstrates how to use the [chrome.declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API to remove the "Cookie" header from requests.

## Overview

Once installed, any requests made in the main frame will be sent without the "Cookie" header.

## Implementation Notes

This sample uses the `chrome.declarativeNetRequest.onRuleMatchedDebug` API which is only available in unpacked extensions.
