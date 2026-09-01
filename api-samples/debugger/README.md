# chrome.debugger

This sample demonstrates using the [`chrome.debugger`](https://developer.chrome.com/docs/extensions/reference/debugger/) API to capture network events on webpages.

## Overview

The extension calls `chrome.debugger.attach()` on a tab to capture network requests when you click the extension's action button. The `Fetch.enable` command is configured with URL patterns that restrict interception to only `http://` and `https://` requests. This prevents the security error: "Cannot access a chrome-extension:// URL of different extension."

The request data is logged in the developer console, demonstrating how to extract network request information.

## Key Implementation Details

**Why URL patterns are necessary:**
- Chrome does not allow extensions to access resources from other extensions (chrome-extension://)
- Without restricting URL patterns, `Fetch.enable` attempts to intercept ALL requests, including chrome-extension:// URLs
- This causes a runtime error: "Unchecked runtime.lastError: Cannot access a chrome-extension:// URL of different extension."
- **Solution:** Use the `patterns` parameter with `Fetch.enable` to only intercept valid web requests:
  ```javascript
  patterns: [
    { urlPattern: 'http://*' },
    { urlPattern: 'https://*' }
  ]
  ```

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Navigate to an HTTP/HTTPS webpage and open the devtools window.
4. Pin the extension to the browser's taskbar and click on the action button to see the network request data logged to the console.
