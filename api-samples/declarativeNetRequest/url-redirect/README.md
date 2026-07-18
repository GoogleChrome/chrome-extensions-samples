# chrome.declarativeNetRequest - URL Redirect

This sample demonstrates using the [`chrome.declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/) API to redirect requests.

## Overview

Once this extension is installed, any requests made in the main frame to the following URLs will be redirected:

- https://developer.chrome.com/docs/extensions/mv2/
- https://developer.chrome.com/docs/extensions/reference/browserAction/
- https://developer.chrome.com/docs/extensions/reference/declarativeWebRequest/
- https://developer.chrome.com/docs/extensions/reference/pageAction/
- https://developer.chrome.com/docs/extensions/reference/webRequest/

## Implementation Notes

This sample uses the `chrome.declarativeNetRequest.onRuleMatchedDebug` event which is only available in unpacked extensions.
